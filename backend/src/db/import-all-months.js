const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

// Month name mapping
const monthMap = {
  'JAN': 'January',
  'FEB': 'February',
  'MAR': 'March',
  'APR': 'April',
  'MAY': 'May',
  'MAY-5': 'May',
  'JUN': 'June',
  'JUN - 6': 'June',
  'JULY': 'July',
  'JULY- 7': 'July',
  'AUG': 'August',
  'AUG - 8': 'August',
  'SEP': 'September',
  'SEP - 9': 'September',
  'OCT': 'October',
  'OCT - 10': 'October',
  'NOV': 'November',
  'NOV - 11': 'November',
  'DEC': 'December',
  'DEC - 12': 'December'
};

// Extract month name from folder name
function getMonthName(folderName) {
  // Try direct match first
  if (monthMap[folderName]) {
    return monthMap[folderName];
  }
  
  // Try to extract month abbreviation
  const upperFolder = folderName.toUpperCase();
  for (const [key, value] of Object.entries(monthMap)) {
    if (upperFolder.includes(key.split(' ')[0]) || upperFolder.includes(key.split('-')[0])) {
      return value;
    }
  }
  
  // Default fallback
  return folderName;
}

async function deleteAllTasks() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Deleting all tasks...');
    await client.query('DELETE FROM tasks');
    await client.query('UPDATE engineers SET tasks_total = 0');
    console.log('✅ All tasks deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting tasks:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function importTasksFromFile(filePath, month, year) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log(`\n📂 Processing: ${path.basename(filePath)}`);
    console.log(`   Month: ${month}, Year: ${year}`);

    const workbook = XLSX.readFile(filePath);
    
    // Find tasks sheet
    const tasksSheetName = workbook.SheetNames.find((name) => 
      name.toUpperCase().includes('NOV') || 
      name.toUpperCase().includes('SEP') ||
      name.toUpperCase().includes('OCT') ||
      name.toUpperCase().includes('DEC') ||
      name.toUpperCase().includes('JAN') ||
      name.toUpperCase().includes('FEB') ||
      name.toUpperCase().includes('MAR') ||
      name.toUpperCase().includes('APR') ||
      name.toUpperCase().includes('MAY') ||
      name.toUpperCase().includes('JUN') ||
      name.toUpperCase().includes('JUL') ||
      name.toUpperCase().includes('AUG') ||
      name.toUpperCase().includes('TASKS') || 
      name.toUpperCase().includes('TASK')
    ) || workbook.SheetNames[0];

    console.log(`   Sheet: ${tasksSheetName}`);

    const sheet = workbook.Sheets[tasksSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Find header row
    let headerRow = null;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      const values = Object.values(row);
      if (values.some(v => typeof v === 'string' && (v.includes('Task') || v.includes('Engineer') || v.includes('Service') || v.includes('Week') || v.includes('Status')))) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === null) {
      headerRow = 0;
    }

    // Map columns
    const headerRowData = data[headerRow];
    const columnMap = {
      description: '',
      engineer: '',
      service: '',
      week: '',
      status: ''
    };

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

    console.log(`   Column mapping:`, columnMap);

    // Import engineers and services first
    const engineers = new Set();
    const services = new Set();

    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || Object.values(row).every(v => !v || v === '')) continue;

      const engineer = String(row[columnMap.engineer] || '').trim();
      const service = String(row[columnMap.service] || '').trim();

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
      const row = data[i];
      if (!row || Object.values(row).every(v => !v || v === '')) continue;

      const engineer = String(row[columnMap.engineer] || '').trim();
      const service = String(row[columnMap.service] || '').trim();
      const weekStr = String(row[columnMap.week] || '').trim();
      const statusStr = String(row[columnMap.status] || '').trim();
      const description = String(row[columnMap.description] || '').trim();

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
      } catch (error) {
        skipped++;
        if (skipped < 5) {
          console.log(`      ⚠️  Error inserting row ${i}: ${error.message}`);
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

    console.log(`   ✅ Imported: ${imported} tasks | Skipped: ${skipped} rows`);
    return { imported, skipped };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`   ❌ Error importing ${path.basename(filePath)}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function importAllMonths() {
  const year2025Path = path.join(__dirname, '2025');
  
  if (!fs.existsSync(year2025Path)) {
    console.error('❌ 2025 folder not found!');
    process.exit(1);
  }

  // Get all month folders, sorted by month order
  const monthFolders = fs.readdirSync(year2025Path, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort((a, b) => {
      const monthOrder = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const aMonth = monthOrder.findIndex(m => a.toUpperCase().includes(m));
      const bMonth = monthOrder.findIndex(m => b.toUpperCase().includes(m));
      return (aMonth === -1 ? 99 : aMonth) - (bMonth === -1 ? 99 : bMonth);
    });

  console.log(`\n📁 Found ${monthFolders.length} month folders:`);
  monthFolders.forEach(folder => console.log(`   - ${folder}`));

  // Delete all tasks first
  await deleteAllTasks();

  let totalImported = 0;
  let totalSkipped = 0;
  const results = [];

  // Process each month
  for (const monthFolder of monthFolders) {
    const monthPath = path.join(year2025Path, monthFolder);
    const files = fs.readdirSync(monthPath).filter(f => 
      f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.xlsm')
    );

    if (files.length === 0) {
      console.log(`\n⚠️  No Excel files found in ${monthFolder}`);
      continue;
    }

    const monthName = getMonthName(monthFolder);
    const filePath = path.join(monthPath, files[0]);

    try {
      const result = await importTasksFromFile(filePath, monthName, 2025);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      results.push({
        month: monthName,
        folder: monthFolder,
        file: files[0],
        imported: result.imported,
        skipped: result.skipped,
        success: true
      });
    } catch (error) {
      results.push({
        month: monthName,
        folder: monthFolder,
        file: files[0],
        imported: 0,
        skipped: 0,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.month.padEnd(12)} | ${result.file.padEnd(40)} | Imported: ${result.imported}, Skipped: ${result.skipped}`);
    } else {
      console.log(`❌ ${result.month.padEnd(12)} | ${result.file.padEnd(40)} | ERROR: ${result.error}`);
    }
  });
  console.log('='.repeat(60));
  console.log(`\n📈 Total: ${totalImported} tasks imported, ${totalSkipped} rows skipped`);
  console.log(`✅ Import process completed!\n`);

  process.exit(0);
}

// Run the import
importAllMonths().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

