const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function importNovemberTasks() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('📅 Importing updated November 2025 tasks...\n');
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, 'NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm'),
      path.join(__dirname, '2025/NOV-11.xlsm'),
      path.join(__dirname, '2025/NOV - 11/NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm'),
      path.join(__dirname, '../2025/NOV - 11/NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm')
    ];
    
    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }
    
    if (!filePath) {
      console.error(`❌ File not found. Tried:`);
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      return;
    }
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    console.log(`📂 Reading file: ${path.basename(filePath)}\n`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Find the November sheet
    let sheetName = null;
    for (const name of workbook.SheetNames) {
      if (name.toUpperCase().includes('NOV')) {
        sheetName = name;
        break;
      }
    }
    
    if (!sheetName) {
      console.error('❌ Could not find NOV sheet in the workbook');
      return;
    }
    
    console.log(`📋 Using sheet: ${sheetName}\n`);
    
    const sheet = workbook.Sheets[sheetName];
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
    
    console.log(`📊 Column mapping:`, columnMap);
    
    if (!columnMap.engineer || !columnMap.service || !columnMap.week) {
      console.error('❌ Could not find required columns (Engineer, Service, Week)');
      return;
    }
    
    // Delete existing November 2025 tasks
    console.log('🗑️  Deleting existing November 2025 tasks...');
    const deleteResult = await client.query(
      'DELETE FROM tasks WHERE month = $1 AND year = $2',
      ['November', 2025]
    );
    console.log(`   ✅ Deleted ${deleteResult.rowCount} existing tasks\n`);
    
    // Process data rows
    const month = 'November';
    const year = 2025;
    let imported = 0;
    let skipped = 0;
    const engineers = new Set();
    const services = new Set();
    
    // Import engineers and services first
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
          console.log(`   ⚠️  Error inserting row ${i + 1}: ${error.message}`);
        }
      }
    }
    
    // Update engineer task counts
    console.log('\n📊 Updating engineer task counts...');
    for (const engineer of engineers) {
      await client.query(
        'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
        [engineer]
      );
    }
    
    // Update service counts
    console.log('📊 Updating service task counts...');
    for (const service of services) {
      await client.query(
        'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1 AND deleted_at IS NULL) WHERE name = $1',
        [service]
      );
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✨ Successfully imported ${imported} tasks for November 2025!`);
    console.log(`   ⚠️  Skipped: ${skipped} rows`);
    console.log(`   👥 Engineers: ${engineers.size}`);
    console.log(`   🔧 Services: ${services.size}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error importing tasks:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
importNovemberTasks()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

