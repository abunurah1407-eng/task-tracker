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

async function addAmaniTasksToExcel() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Fetching Amani tasks for November 2025 from database...\n');
    
    // Query all Amani tasks for November 2025
    const result = await client.query(
      `SELECT notes as description, week, engineer, service, status 
       FROM tasks 
       WHERE engineer = 'Amani' 
       AND month = 'November' 
       AND year = 2025 
       AND deleted_at IS NULL
       ORDER BY week, service, id`
    );
    
    const amaniTasks = result.rows;
    console.log(`✅ Found ${amaniTasks.length} Amani tasks in database\n`);
    
    if (amaniTasks.length === 0) {
      console.log('⚠️  No Amani tasks found in database for November 2025');
      return;
    }
    
    // Path to the November file
    const filePath = path.join(__dirname, 'NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm');
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }
    
    console.log('📂 Reading November Excel file...\n');
    
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    
    // Find the NOV sheet
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
    
    // Get the sheet data
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
    
    // Find the last row with data
    let lastDataRow = data.length - 1;
    while (lastDataRow >= 0 && (!data[lastDataRow] || data[lastDataRow].every(cell => !cell || cell === ''))) {
      lastDataRow--;
    }
    
    console.log(`📊 Found ${lastDataRow + 1} rows in the sheet`);
    console.log(`📝 Adding ${amaniTasks.length} Amani tasks...\n`);
    
    // Find header row to determine column positions
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some(cell => {
        const cellStr = String(cell || '').toLowerCase();
        return cellStr.includes('task') || cellStr.includes('engineer') || 
               cellStr.includes('service') || cellStr.includes('week') || 
               cellStr.includes('status');
      })) {
        headerRow = i;
        break;
      }
    }
    
    const headerRowData = data[headerRow];
    
    // Find column indices
    const findColumn = (keywords) => {
      for (let i = 0; i < headerRowData.length; i++) {
        const cell = String(headerRowData[i] || '').toLowerCase();
        if (keywords.some(keyword => cell.includes(keyword))) {
          return i;
        }
      }
      return -1;
    };
    
    const taskCol = findColumn(['task', 'description', 'note']);
    const engineerCol = findColumn(['engineer', 'assign']);
    const serviceCol = findColumn(['service']);
    const weekCol = findColumn(['week']);
    const statusCol = findColumn(['status', 'state']);
    
    console.log(`📊 Column mapping:`);
    console.log(`   Task: ${taskCol >= 0 ? taskCol : 'Not found'}`);
    console.log(`   Engineer: ${engineerCol >= 0 ? engineerCol : 'Not found'}`);
    console.log(`   Service: ${serviceCol >= 0 ? serviceCol : 'Not found'}`);
    console.log(`   Week: ${weekCol >= 0 ? weekCol : 'Not found'}`);
    console.log(`   Status: ${statusCol >= 0 ? statusCol : 'Not found'}\n`);
    
    if (taskCol === -1 || engineerCol === -1 || serviceCol === -1 || weekCol === -1) {
      console.error('❌ Could not find required columns');
      return;
    }
    
    // Convert week number to "Week X" format
    const formatWeek = (week) => {
      if (typeof week === 'number') {
        return `Week ${week}`;
      }
      if (typeof week === 'string' && week.startsWith('Week')) {
        return week;
      }
      return `Week ${week}`;
    };
    
    // Add Amani tasks
    let addedCount = 0;
    for (const task of amaniTasks) {
      const newRow = [];
      
      // Initialize row with empty cells up to the maximum column needed
      const maxCol = Math.max(taskCol, engineerCol, serviceCol, weekCol, statusCol);
      for (let i = 0; i <= maxCol; i++) {
        newRow[i] = '';
      }
      
      // Fill in the task data
      if (taskCol >= 0) newRow[taskCol] = task.description || '';
      if (weekCol >= 0) newRow[weekCol] = formatWeek(task.week);
      if (engineerCol >= 0) newRow[engineerCol] = task.engineer;
      if (serviceCol >= 0) newRow[serviceCol] = task.service;
      if (statusCol >= 0) newRow[statusCol] = task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Completed';
      
      // Add the row after the last data row
      data.splice(lastDataRow + 1, 0, newRow);
      lastDataRow++;
      addedCount++;
      
      console.log(`   ✅ Added: "${task.description || 'No description'}" - ${task.engineer} - ${task.service} - ${formatWeek(task.week)} - ${task.status || 'Completed'}`);
    }
    
    // Convert back to worksheet
    const newSheet = XLSX.utils.aoa_to_sheet(data);
    workbook.Sheets[sheetName] = newSheet;
    
    // Write the file
    XLSX.writeFile(workbook, filePath);
    
    console.log(`\n✨ Successfully added ${addedCount} Amani tasks to the November Excel file!`);
    console.log(`📁 File saved: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAmaniTasksToExcel()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

