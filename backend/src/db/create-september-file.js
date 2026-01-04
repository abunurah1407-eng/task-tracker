const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the original November file
const novFilePath = path.join(__dirname, 'NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm');
const workbook = XLSX.readFile(novFilePath);

// Get the NOV sheet
const novSheet = workbook.Sheets['NOV'];
const novData = XLSX.utils.sheet_to_json(novSheet, { defval: '', header: 1 });

// Get the Summery sheet if it exists
let summerySheet = null;
let summeryData = null;
if (workbook.Sheets['Summery']) {
  summerySheet = workbook.Sheets['Summery'];
  summeryData = XLSX.utils.sheet_to_json(summerySheet, { defval: '', header: 1 });
}

// Find header row in NOV sheet
let headerRowIndex = 0;
for (let i = 0; i < Math.min(10, novData.length); i++) {
  const row = novData[i];
  if (row && row.some && row.some(cell => 
    typeof cell === 'string' && (
      cell.includes('Task') || 
      cell.includes('Engineer') || 
      cell.includes('Service') || 
      cell.includes('Week') || 
      cell.includes('Status')
    )
  )) {
    headerRowIndex = i;
    break;
  }
}

// Extract header row
const headerRow = novData[headerRowIndex];

// Extract existing data rows (skip header)
const dataRows = novData.slice(headerRowIndex + 1).filter(row => 
  row && row.some && row.some(cell => cell && cell !== '')
);

// Get unique engineers and services from existing data
const engineers = new Set();
const services = new Set();
const taskDescriptions = [];

dataRows.forEach(row => {
  if (row[3]) engineers.add(row[3].toString().trim());
  if (row[4]) services.add(row[4].toString().trim());
  if (row[1]) taskDescriptions.push(row[1].toString().trim());
});

const engineerList = Array.from(engineers);
const serviceList = Array.from(services);

// Generate random tasks for September
const statuses = ['Completed', 'In Progress', 'Pending'];
const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

// Generate random number of tasks (between 50-100)
const numTasks = Math.floor(Math.random() * 50) + 50;

// Create September data
const septemberData = [headerRow]; // Start with header

for (let i = 1; i <= numTasks; i++) {
  const week = weeks[Math.floor(Math.random() * weeks.length)];
  const engineer = engineerList[Math.floor(Math.random() * engineerList.length)];
  const service = serviceList[Math.floor(Math.random() * serviceList.length)];
  
  // Generate random status with weighted probability (more completed tasks)
  const statusRand = Math.random();
  let status;
  if (statusRand < 0.5) {
    status = 'Completed';
  } else if (statusRand < 0.8) {
    status = 'In Progress';
  } else {
    status = 'Pending';
  }
  
  // Generate task description (use existing pattern or create new)
  let taskDesc;
  if (taskDescriptions.length > 0 && Math.random() > 0.3) {
    // 70% chance to use/modify existing task description
    const baseTask = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];
    // Replace NOV references with SEP or keep generic
    taskDesc = baseTask.replace(/NOV/g, 'SEP').replace(/November/g, 'September');
  } else {
    // 30% chance to create new task
    const taskTypes = [
      'ETEC-NCA-0011',
      'ETEC-NCA-0012',
      'ETEC-NCA-0013',
      'ETEC-NCA-0014',
      'ETEC-NCA-0015'
    ];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const taskNum = Math.floor(Math.random() * 9999) + 1000;
    const taskSubNum = Math.floor(Math.random() * 999) + 100;
    const taskNames = [
      'Persistence - Accessibility Features',
      'Persistence - MySQL File Write',
      'Security Configuration Review',
      'Network Security Assessment',
      'Vulnerability Scanning',
      'Penetration Testing',
      'Security Audit',
      'Compliance Check',
      'Access Control Review',
      'Data Encryption Review'
    ];
    const taskName = taskNames[Math.floor(Math.random() * taskNames.length)];
    taskDesc = `${taskType}-${taskNum}.${taskSubNum} ${taskName}`;
  }
  
  // Create row matching the structure
  const row = new Array(headerRow.length).fill('');
  row[0] = i; // No
  row[1] = taskDesc; // Task Description
  row[2] = week; // Week
  row[3] = engineer; // Engineer
  row[4] = service; // Services List
  row[5] = status; // Status
  row[6] = ''; // Empty
  row[7] = status; // Tasks Status Overall (same as status)
  row[8] = 0; // Number
  
  septemberData.push(row);
}

// Create new workbook
const newWorkbook = XLSX.utils.book_new();

// Create September sheet
const septemberSheet = XLSX.utils.aoa_to_sheet(septemberData);
XLSX.utils.book_append_sheet(newWorkbook, septemberSheet, 'SEP');

// Copy Summery sheet if it exists (or create a simple one)
if (summeryData && summeryData.length > 0) {
  const newSummerySheet = XLSX.utils.aoa_to_sheet(summeryData);
  XLSX.utils.book_append_sheet(newWorkbook, newSummerySheet, 'Summery');
} else {
  // Create a simple summery sheet
  const simpleSummery = [
    ['Engineers', ...engineerList],
    ['Services', ...serviceList]
  ];
  const newSummerySheet = XLSX.utils.aoa_to_sheet(simpleSummery);
  XLSX.utils.book_append_sheet(newWorkbook, newSummerySheet, 'Summery');
}

// Write the file
const outputPath = path.join(__dirname, 'SEP - 09 - Task Tracker ETEC 2025 CyberOps.xlsm');
XLSX.writeFile(newWorkbook, outputPath, { bookType: 'xlsm' });

console.log(`✅ Created September file: ${outputPath}`);
console.log(`📊 Generated ${numTasks} tasks`);
console.log(`👥 Engineers: ${engineerList.length}`);
console.log(`🔧 Services: ${serviceList.length}`);

