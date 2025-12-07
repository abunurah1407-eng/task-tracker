import { Router, Response, Request } from 'express';
import multer from 'multer';
import { pool } from '../config/database';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import * as XLSX from 'xlsx';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/octet-stream'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|xlsm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .xlsm) are allowed'));
    }
  },
});

// Extend AuthRequest to include file
interface ImportRequest extends AuthRequest {
  file?: Express.Multer.File;
}

// Preview Excel file - analyze without importing
router.post('/preview', authenticate, requireRole('admin', 'director'), upload.single('file'), async (req: ImportRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Find the tasks sheet (NOV, Tasks, or first sheet)
    const tasksSheetName = workbook.SheetNames.find((name: string) => 
      name.includes('NOV') || name.includes('Tasks') || name.includes('Task')
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[tasksSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Find header row
    let headerRow = null;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] as Record<string, any>;
      const values = Object.values(row);
      if (values.some((v: any) => typeof v === 'string' && (v.includes('Task') || v.includes('Engineer') || v.includes('Service') || v.includes('Week') || v.includes('Status')))) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === null) {
      headerRow = 0;
    }

    // Map columns
    const headerRowData = data[headerRow] as Record<string, any>;
    const columnMap: Record<string, string> = {};
    Object.keys(headerRowData).forEach(key => {
      const value = String(headerRowData[key] || '').toLowerCase().trim();
      if ((value.includes('task') || value.includes('description')) && !columnMap.description) {
        columnMap.description = key;
      }
      if (value.includes('engineer') && !columnMap.engineer) {
        columnMap.engineer = key;
      }
      if ((value.includes('service') || value.includes('services list')) && !columnMap.service) {
        columnMap.service = key;
      }
      if (value.includes('week') && !columnMap.week) {
        columnMap.week = key;
      }
      if ((value.includes('status') || value === 'status') && !columnMap.status) {
        columnMap.status = key;
      }
    });

    // Analyze data
    let validRows = 0;
    let invalidRows = 0;
    const engineers = new Set<string>();
    const services = new Set<string>();
    const statusCounts: Record<string, number> = { pending: 0, 'in-progress': 0, completed: 0 };

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      if (!row || Object.values(row).every((v: any) => !v || v === '')) continue;

      const engineer = String((row[columnMap.engineer] || '') as string).trim();
      const service = String((row[columnMap.service] || '') as string).trim();
      const weekStr = String((row[columnMap.week] || '') as string).trim();

      if (!engineer || !service || !weekStr) {
        invalidRows++;
        continue;
      }

      const weekMatch = weekStr.match(/(\d+)/);
      const week = weekMatch ? parseInt(weekMatch[1]) : null;
      if (!week || week < 1 || week > 4) {
        invalidRows++;
        continue;
      }

      validRows++;
      engineers.add(engineer);
      services.add(service);

      // Count status
      const statusStr = String((row[columnMap.status] || '') as string).trim().toLowerCase();
      if (statusStr.includes('complete') || statusStr.includes('done')) {
        statusCounts.completed++;
      } else if (statusStr.includes('progress')) {
        statusCounts['in-progress']++;
      } else {
        statusCounts.pending++;
      }
    }

    res.json({
      sheetName: tasksSheetName,
      totalRows: data.length - headerRow - 1,
      validRows,
      invalidRows,
      engineers: Array.from(engineers).sort(),
      services: Array.from(services).sort(),
      statusCounts,
      columnMap,
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message || 'Failed to preview file' });
  }
});

// Import Excel file
router.post('/import', authenticate, requireRole('admin', 'director'), upload.single('file'), async (req: ImportRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    await client.query('BEGIN');

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Find tasks sheet
    const tasksSheetName = workbook.SheetNames.find((name: string) => 
      name.includes('NOV') || name.includes('Tasks') || name.includes('Task')
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[tasksSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Find header row
    let headerRow = null;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] as Record<string, any>;
      const values = Object.values(row);
      if (values.some((v: any) => typeof v === 'string' && (v.includes('Task') || v.includes('Engineer') || v.includes('Service') || v.includes('Week') || v.includes('Status')))) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === null) {
      headerRow = 0;
    }

    // Map columns
    const headerRowData = data[headerRow] as Record<string, any>;
    const columnMap: Record<string, string> = {};
    Object.keys(headerRowData).forEach(key => {
      const value = String(headerRowData[key] || '').toLowerCase().trim();
      if ((value.includes('task') || value.includes('description')) && !columnMap.description) {
        columnMap.description = key;
      }
      if (value.includes('engineer') && !columnMap.engineer) {
        columnMap.engineer = key;
      }
      if ((value.includes('service') || value.includes('services list')) && !columnMap.service) {
        columnMap.service = key;
      }
      if (value.includes('week') && !columnMap.week) {
        columnMap.week = key;
      }
      if ((value.includes('status') || value === 'status') && !columnMap.status) {
        columnMap.status = key;
      }
    });

    // Import engineers and services first
    const engineers = new Set<string>();
    const services = new Set<string>();

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      if (!row || Object.values(row).every((v: any) => !v || v === '')) continue;

      const engineer = String((row[columnMap.engineer] || '') as string).trim();
      const service = String((row[columnMap.service] || '') as string).trim();

      if (engineer) engineers.add(engineer);
      if (service) services.add(service);
    }

    // Insert engineers
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#eab308'];
    let colorIndex = 0;
    for (const engineer of engineers) {
      if (!engineer) continue;
      const color = colors[colorIndex % colors.length];
      colorIndex++;
      await client.query(
        'INSERT INTO engineers (name, color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [engineer, color]
      );
    }

    // Insert services
    for (const service of services) {
      if (!service) continue;
      await client.query(
        'INSERT INTO services (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [service, 'primary']
      );
    }

    // Import tasks
    let imported = 0;
    let skipped = 0;

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      if (!row || Object.values(row).every((v: any) => !v || v === '')) continue;

      const engineer = String((row[columnMap.engineer] || '') as string).trim();
      const service = String((row[columnMap.service] || '') as string).trim();
      const weekStr = String((row[columnMap.week] || '') as string).trim();
      const statusStr = String((row[columnMap.status] || '') as string).trim();
      const description = String((row[columnMap.description] || '') as string).trim();

      if (!engineer || !service || !weekStr) {
        skipped++;
        continue;
      }

      const weekMatch = weekStr.match(/(\d+)/);
      const week = weekMatch ? parseInt(weekMatch[1]) : null;
      if (!week || week < 1 || week > 4) {
        skipped++;
        continue;
      }

      // Map status
      let status = 'pending';
      const statusLower = statusStr.toLowerCase();
      if (statusLower === 'completed' || statusLower === 'complete' || statusLower === 'done' || 
          statusLower.includes('complete') || statusLower.includes('done')) {
        status = 'completed';
      } else if (statusLower === 'in-progress' || statusLower === 'in progress' || statusLower === 'progress' ||
                 statusLower.includes('progress') || statusLower.includes('in progress')) {
        status = 'in-progress';
      } else if (statusLower === 'pending' || statusLower.includes('pending')) {
        status = 'pending';
      }

      const priority = 'medium';
      const notes = description || null;

      try {
        await client.query(
          `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [service, engineer, week, month, year, status, priority, notes]
        );
        imported++;
      } catch (error: any) {
        skipped++;
        if (skipped < 5) {
          console.log(`Error inserting row ${i}: ${error.message}`);
        }
      }
    }

    // Update engineer task counts
    for (const engineer of engineers) {
      await client.query(
        'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
        [engineer]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      imported,
      skipped,
      month,
      year,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import file' });
  } finally {
    client.release();
  }
});

export default router;

