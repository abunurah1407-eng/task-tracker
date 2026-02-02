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
router.post('/preview', authenticate, upload.single('file'), async (req: ImportRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Try to detect month from filename first (most reliable), then body
    let requestedMonth = '';
    if (req.file && req.file.originalname) {
      // Try to extract month from filename (e.g., "jan- 01 - Task Tracker...")
      const filename = req.file.originalname.toUpperCase();
      const monthMatch = filename.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
      if (monthMatch) {
        requestedMonth = monthMatch[1];
        console.log(`📅 Detected month from filename: ${requestedMonth}`);
      }
    }
    // Fallback to body if not found in filename
    if (!requestedMonth && req.body && typeof req.body.month === 'string') {
      requestedMonth = req.body.month.toUpperCase().substring(0, 3);
      console.log(`📅 Using month from request body: ${requestedMonth}`);
    }
    
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    console.log(`📂 Available sheets:`, workbook.SheetNames);
    console.log(`📂 Detected month from filename/body: ${requestedMonth}`);
    
    let tasksSheetName = workbook.SheetNames[0]; // Default to first sheet
    
    // Priority 1: Sheet matching requested month
    if (requestedMonth) {
      const monthSheet = workbook.SheetNames.find((name: string) => {
        const upperName = name.toUpperCase();
        return upperName.includes(requestedMonth);
      });
      if (monthSheet) {
        tasksSheetName = monthSheet;
        console.log(`✅ Found sheet matching requested month: ${tasksSheetName}`);
      }
    }
    
    // Priority 2: Any month name or task-related name
    // Note: Some files have wrong sheet names (e.g., NOV sheet for JAN file)
    // So we'll use the first data sheet we find, prioritizing non-summary sheets
    if (tasksSheetName === workbook.SheetNames[0]) {
      // Skip summary/summery sheets
      const summarySheets = ['SUMMERY', 'SUMMARY', 'STATISTICS', 'STATS', 'احصائيات'];
      const foundSheet = workbook.SheetNames.find((name: string) => {
        const upperName = name.toUpperCase();
        const isSummary = summarySheets.some(s => upperName.includes(s));
        if (isSummary) return false;
        
        return monthNames.some(m => upperName.includes(m)) || 
               upperName.includes('TASKS') || 
               upperName.includes('TASK') ||
               upperName.includes('DATA') ||
               upperName.includes('SHEET');
      });
      if (foundSheet) {
        tasksSheetName = foundSheet;
        console.log(`✅ Found sheet with month/task name: ${tasksSheetName}`);
      } else {
        // If no match, use first non-summary sheet
        const nonSummarySheet = workbook.SheetNames.find((name: string) => {
          const upperName = name.toUpperCase();
          return !summarySheets.some(s => upperName.includes(s));
        });
        if (nonSummarySheet) {
          tasksSheetName = nonSummarySheet;
          console.log(`✅ Using first non-summary sheet: ${tasksSheetName}`);
        }
      }
    }
    
    console.log(`📂 Using sheet: ${tasksSheetName}`);

    const sheet = workbook.Sheets[tasksSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Find header row - search more thoroughly (up to 20 rows)
    let headerRow = null;
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i] as Record<string, any>;
      const values = Object.values(row).map(v => String(v || '').toLowerCase().trim());
      const hasTask = values.some(v => v.includes('task') || v.includes('description') || v.includes('note'));
      const hasEngineer = values.some(v => v.includes('engineer') || v.includes('name'));
      const hasService = values.some(v => v.includes('service'));
      const hasWeek = values.some(v => v.includes('week') || v.includes('wk'));
      const hasStatus = values.some(v => v.includes('status') || v.includes('state'));
      
      // Need at least 2 matching columns to consider it a header
      const matchCount = [hasTask, hasEngineer, hasService, hasWeek, hasStatus].filter(Boolean).length;
      if (matchCount >= 2) {
        headerRow = i;
        console.log(`📋 Header row found at index: ${i} (${matchCount} matching columns)`);
        break;
      }
    }

    if (headerRow === null) {
      headerRow = 0;
      console.log(`⚠️ No header row found, using first row`);
    }

    // Map columns - more flexible matching
    const headerRowData = data[headerRow] as Record<string, any>;
    const columnMap: Record<string, string> = {};
    
    console.log('🔍 Header row sample:', Object.keys(headerRowData).slice(0, 10).map(k => `${k}: ${String(headerRowData[k]).substring(0, 30)}`));
    
    Object.keys(headerRowData).forEach(key => {
      const value = String(headerRowData[key] || '').toLowerCase().trim();
      
      // Description/Task column - more variations (handle trailing spaces)
      if (!columnMap.description && (
        value.includes('task') || 
        value.includes('description') || 
        value.includes('note') || 
        value.includes('detail') ||
        value.includes('comment') ||
        value.trim() === 'task' ||
        value.trim() === 'description' ||
        value.trim().startsWith('task description')
      )) {
        columnMap.description = key;
      }
      
      // Engineer column - more variations
      if (!columnMap.engineer && (
        value.includes('engineer') || 
        value.includes('name') ||
        value.trim() === 'engineer' ||
        value.trim() === 'name'
      )) {
        columnMap.engineer = key;
      }
      
      // Service column - more variations (handle "Services List")
      if (!columnMap.service && (
        value.includes('service') || 
        value.includes('services') ||
        value.trim() === 'service' ||
        value.trim() === 'services' ||
        value.trim() === 'services list'
      )) {
        columnMap.service = key;
      }
      
      // Week column - more variations
      if (!columnMap.week && (
        value.includes('week') || 
        value.includes('wk') ||
        value.trim() === 'week' ||
        value.trim() === 'wk'
      )) {
        columnMap.week = key;
      }
      
      // Status column - more variations
      if (!columnMap.status && (
        value.includes('status') || 
        value.includes('state') ||
        value.trim() === 'status' ||
        value.trim() === 'state'
      )) {
        columnMap.status = key;
      }
    });
    
    console.log('📊 Column mapping result:', columnMap);

    // Analyze data
    let validRows = 0;
    let invalidRows = 0;
    const engineers = new Set<string>();
    const services = new Set<string>();
    const statusCounts: Record<string, number> = { pending: 0, 'in-progress': 0, completed: 0 };

    // For engineers, get their engineer name
    const loggedInEngineer = req.user?.role === 'engineer' ? req.user?.engineerName : null;

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      if (!row || Object.values(row).every((v: any) => !v || v === '')) continue;

      // Try to get values from mapped columns, or try all columns if mapping failed
      let engineer = '';
      let service = '';
      let weekStr = '';
      
      if (columnMap.engineer) {
        engineer = String((row[columnMap.engineer] || '') as string).trim();
      } else {
        // Try to find engineer in any column
        for (const key of Object.keys(row)) {
          const val = String(row[key] || '').trim();
          if (val && (val.toLowerCase().includes('engineer') || val.length > 2)) {
            // Check if this might be an engineer name (not a header)
            if (i === headerRow + 1 || !val.toLowerCase().includes('engineer')) {
              engineer = val;
              break;
            }
          }
        }
      }
      
      if (columnMap.service) {
        service = String((row[columnMap.service] || '') as string).trim();
      } else {
        // Try to find service in any column
        for (const key of Object.keys(row)) {
          const val = String(row[key] || '').trim();
          if (val && val.length > 2 && !val.match(/^\d+$/)) {
            service = val;
            break;
          }
        }
      }
      
      if (columnMap.week) {
        weekStr = String((row[columnMap.week] || '') as string).trim();
      } else {
        // Try to find week in any column
        for (const key of Object.keys(row)) {
          const val = String(row[key] || '').trim();
          if (val && (val.match(/^\d+$/) || val.toLowerCase().includes('week'))) {
            weekStr = val;
            break;
          }
        }
      }

      // For engineers, use logged-in engineer name regardless of what's in the Excel file
      if (loggedInEngineer) {
        engineer = loggedInEngineer; // Always use logged-in engineer, ignore Excel value
      }

      if (!engineer || !service || !weekStr) {
        invalidRows++;
        if (invalidRows <= 3) {
          console.log(`⚠️ Invalid row ${i}:`, { engineer, service, weekStr, rowKeys: Object.keys(row) });
        }
        continue;
      }

      const weekMatch = weekStr.match(/(\d+)/);
      const week = weekMatch ? parseInt(weekMatch[1]) : null;
      if (!week || week < 1 || week > 4) {
        invalidRows++;
        if (invalidRows <= 3) {
          console.log(`⚠️ Invalid week in row ${i}:`, weekStr, '->', week);
        }
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
router.post('/import', authenticate, upload.single('file'), async (req: ImportRequest, res: Response) => {
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
    
    // Try to detect month from filename first
    let requestedMonth = '';
    if (req.file && req.file.originalname) {
      const filename = req.file.originalname.toUpperCase();
      const monthMatch = filename.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
      if (monthMatch) {
        requestedMonth = monthMatch[1];
        console.log(`📅 Detected month from filename: ${requestedMonth}`);
      }
    }
    
    // Find tasks sheet - skip summary sheets
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const summarySheets = ['SUMMERY', 'SUMMARY', 'STATISTICS', 'STATS', 'احصائيات'];
    
    let tasksSheetName = workbook.SheetNames[0];
    
    // Priority 1: Sheet matching requested month
    if (requestedMonth) {
      const monthSheet = workbook.SheetNames.find((name: string) => {
        const upperName = name.toUpperCase();
        return upperName.includes(requestedMonth);
      });
      if (monthSheet) {
        tasksSheetName = monthSheet;
        console.log(`✅ Found sheet matching requested month: ${tasksSheetName}`);
      }
    }
    
    // Priority 2: First non-summary sheet with month/task name
    if (tasksSheetName === workbook.SheetNames[0]) {
      const foundSheet = workbook.SheetNames.find((name: string) => {
        const upperName = name.toUpperCase();
        const isSummary = summarySheets.some(s => upperName.includes(s));
        if (isSummary) return false;
        
        return monthNames.some(m => upperName.includes(m)) || 
               upperName.includes('TASKS') || 
               upperName.includes('TASK') ||
               upperName.includes('DATA');
      });
      if (foundSheet) {
        tasksSheetName = foundSheet;
        console.log(`✅ Found sheet with month/task name: ${tasksSheetName}`);
      } else {
        // Use first non-summary sheet
        const nonSummarySheet = workbook.SheetNames.find((name: string) => {
          const upperName = name.toUpperCase();
          return !summarySheets.some(s => upperName.includes(s));
        });
        if (nonSummarySheet) {
          tasksSheetName = nonSummarySheet;
          console.log(`✅ Using first non-summary sheet: ${tasksSheetName}`);
        }
      }
    }
    
    console.log(`📂 Using sheet: ${tasksSheetName}`);

    const sheet = workbook.Sheets[tasksSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Find header row - search more thoroughly (up to 20 rows)
    let headerRow = null;
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i] as Record<string, any>;
      const values = Object.values(row).map(v => String(v || '').toLowerCase().trim());
      const hasTask = values.some(v => v.includes('task') || v.includes('description') || v.includes('note'));
      const hasEngineer = values.some(v => v.includes('engineer') || v.includes('name'));
      const hasService = values.some(v => v.includes('service'));
      const hasWeek = values.some(v => v.includes('week') || v.includes('wk'));
      const hasStatus = values.some(v => v.includes('status') || v.includes('state'));
      
      // Need at least 2 matching columns to consider it a header
      const matchCount = [hasTask, hasEngineer, hasService, hasWeek, hasStatus].filter(Boolean).length;
      if (matchCount >= 2) {
        headerRow = i;
        console.log(`📋 Header row found at index: ${i} (${matchCount} matching columns)`);
        break;
      }
    }

    if (headerRow === null) {
      headerRow = 0;
      console.log(`⚠️ No header row found, using first row`);
    }

    // Map columns - handle trailing spaces and "Services List"
    const headerRowData = data[headerRow] as Record<string, any>;
    const columnMap: Record<string, string> = {};
    
    console.log('🔍 Header row sample:', Object.keys(headerRowData).slice(0, 10).map(k => `${k}: ${String(headerRowData[k]).substring(0, 30)}`));
    
    Object.keys(headerRowData).forEach(key => {
      const value = String(headerRowData[key] || '').toLowerCase().trim();
      
      // Description/Task column - handle trailing spaces
      if (!columnMap.description && (
        value.includes('task') || 
        value.includes('description') || 
        value.includes('note') || 
        value.includes('detail') ||
        value.includes('comment') ||
        value === 'task' ||
        value === 'description' ||
        value.trim().startsWith('task description')
      )) {
        columnMap.description = key;
      }
      
      // Engineer column
      if (!columnMap.engineer && (
        value.includes('engineer') || 
        value.includes('name') ||
        value.trim() === 'engineer' ||
        value.trim() === 'name'
      )) {
        columnMap.engineer = key;
      }
      
      // Service column - handle "Services List"
      if (!columnMap.service && (
        value.includes('service') || 
        value.includes('services') ||
        value.trim() === 'service' ||
        value.trim() === 'services' ||
        value.trim() === 'services list'
      )) {
        columnMap.service = key;
      }
      
      // Week column
      if (!columnMap.week && (
        value.includes('week') || 
        value.includes('wk') ||
        value.trim() === 'week' ||
        value.trim() === 'wk'
      )) {
        columnMap.week = key;
      }
      
      // Status column
      if (!columnMap.status && (
        value.includes('status') || 
        value.includes('state') ||
        value.trim() === 'status' ||
        value.trim() === 'state'
      )) {
        columnMap.status = key;
      }
    });
    
    console.log('📊 Column mapping result:', columnMap);

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
    const importedTaskIds: number[] = [];

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      if (!row || Object.values(row).every((v: any) => !v || v === '')) continue;

      let engineer = String((row[columnMap.engineer] || '') as string).trim();
      const service = String((row[columnMap.service] || '') as string).trim();
      const weekStr = String((row[columnMap.week] || '') as string).trim();
      const statusStr = String((row[columnMap.status] || '') as string).trim();
      const description = String((row[columnMap.description] || '') as string).trim();

      // For engineers, force the engineer name to be the logged-in engineer
      if (req.user?.role === 'engineer') {
        if (!req.user?.engineerName) {
          skipped++;
          continue;
        }
        engineer = req.user.engineerName;
      }

      if (!engineer || !service || !weekStr) {
        skipped++;
        continue;
      }

      // Parse week - handle "Week 1", "1", "wk 1", etc.
      let week: number | null = null;
      const weekMatch = weekStr.match(/(\d+)/);
      if (weekMatch) {
        week = parseInt(weekMatch[1]);
      }
      if (!week || week < 1 || week > 4) {
        if (skipped < 5) {
          console.log(`⚠️ Invalid week in row ${i}:`, weekStr, '->', week);
        }
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
        const result = await client.query(
          `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [service, engineer, week, month, year, status, priority, notes]
        );
        importedTaskIds.push(result.rows[0].id);
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
        'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
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
      taskIds: importedTaskIds, // Return task IDs for undo functionality
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import file' });
  } finally {
    client.release();
  }
});

// Undo import - delete tasks by their IDs
router.post('/undo', authenticate, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { taskIds } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'Task IDs are required' });
    }

    // Validate that all taskIds are numbers
    const validTaskIds = taskIds.filter(id => typeof id === 'number' && id > 0);
    if (validTaskIds.length === 0) {
      return res.status(400).json({ error: 'Invalid task IDs provided' });
    }

    await client.query('BEGIN');

    // Get engineer names from tasks before deleting (for updating task counts)
    const tasksResult = await client.query(
      `SELECT DISTINCT engineer FROM tasks WHERE id = ANY($1::int[])`,
      [validTaskIds]
    );
    const affectedEngineers = tasksResult.rows.map(row => row.engineer);

    // Delete the tasks
    const deleteResult = await client.query(
      `DELETE FROM tasks WHERE id = ANY($1::int[]) RETURNING id`,
      [validTaskIds]
    );

    const deletedCount = deleteResult.rows.length;

    // Update engineer task counts
    for (const engineer of affectedEngineers) {
      await client.query(
        'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
        [engineer]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      deleted: deletedCount,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Undo import error:', error);
    res.status(500).json({ error: error.message || 'Failed to undo import' });
  } finally {
    client.release();
  }
});

export default router;

