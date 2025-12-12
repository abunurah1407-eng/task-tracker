const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the November file
const filePath = path.join(__dirname, 'NOV - 11 - Task Tracker ETEC 2025 CyberOps.xlsm');

// Tasks to add - Milaf November tasks only
const newTasks = [
  { task: 'investigation on artl and detected a lot of vulnerbilities', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'investigation on Integration API and detected that token is exploiteble.', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'تسريب على الخدمات الخاصه بالهيئة', week: 'Week 1', engineer: 'Milaf', service: 'threat intel', status: 'Completed' },
  { task: 'Cybel Advisory Email Activation asking for', week: 'Week 1', engineer: 'Milaf', service: 'OTHER', status: 'Completed' },
  { task: 'RE: Cybel Health Check on keywords', week: 'Week 1', engineer: 'Milaf', service: 'Health Check', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 1', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 2', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 3', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 4', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 5', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 6', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 7', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 8', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'NCA - Cyber Range Sesstion 9', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'ivestigation on some activity and detected suspicious IPs', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: WSO2  Vulnerability', week: 'Week 1', engineer: 'Milaf', service: 'vulnerbility', status: 'Completed' },
  { task: 'RE: WSO2  Vulnerability', week: 'Week 1', engineer: 'Milaf', service: 'vulnerbility', status: 'Completed' },
  { task: 'after investigation on some activity I found some user agent ask eng sultan to do it', week: 'Week 1', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: SAP NetWeaver Security Vulnerability - CVE-2025-42944', week: 'Week 1', engineer: 'Milaf', service: 'vulnerbility', status: 'Completed' },
  { task: 'meeting to solve RE: فريق الزيارة لا يستطع الاطلاع على المعايير في منصة المراجعين', week: 'Week 2', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: فريق الزيارة لا يستطع الاطلاع على المعايير في منصة المراجعين', week: 'Week 2', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'slove RE:  تذكير! يرجى إكمال مهام البرنامج التوعوي التدريبي الإلزامية لشهر نوفمبر', week: 'Week 2', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: SAP NetWeaver Security Vulnerability - CVE-2025-42944', week: 'Week 2', engineer: 'Milaf', service: 'vulnerbility', status: 'Completed' },
  { task: 'checking on 300 user if it disiable or not', week: 'Week 3', engineer: 'Milaf', service: 'OTHER', status: 'Completed' },
  { task: 'RE: Cybel Health Check', week: 'Week 3', engineer: 'Milaf', service: 'Health Check', status: 'Completed' },
  { task: 'INC#2511-8', week: 'Week 2', engineer: 'Milaf', service: 'Reporting', status: 'Completed' },
  { task: 'INC#2511-9', week: 'Week 2', engineer: 'Milaf', service: 'Reporting', status: 'Completed' },
  { task: 'INC#2511-12', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-13', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-15', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-16', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-24', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-74', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-102', week: 'Week 3', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-104', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-110', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-112', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-122', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-123', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-124', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-133', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-146', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-147', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-153', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-177', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-179', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: 'INC#2511-185', week: 'Week 4', engineer: 'Milaf', service: 'SOC Alerts', status: 'Completed' },
  { task: '(CS-Incident Emails) RE: m [Phish Alert] هناك تعليق على طلب إجازتك', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) RE: M هل أنت جاهز للمؤتمر السادس للشبكة العربية لضمان الجودة في التعليم العالي ؟ حمل تطبيق whova', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) RE:M  Validate your profile for المؤتمر السادس للشبكة العربية لضمان الجودة في التعليم العالي', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) RE: M [Phish Alert] [*Newsletter*] Get started with Catalyst Center to begin your journey', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) RE: M [Phish Alert] [*Newsletter*] Invitation: Saudi Arabia\'s Gateway to Industrial Innovation', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) RE: [Phish Alert] معاملة متأخرة  (100000-2144000-47)', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) M RE: تطبيق سياسة جديدة', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) FW: تطبيق سياسة جديدة', week: 'Week 2', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: '(CS-Incident Emails) FW: M[Phish Alert] تطبيق سياسة جديدة', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M تطبيق سياسة جديدة', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M[Phish Alert] تطبيق سياسة جديدة', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M بلاغ عن بريد إلكتروني مشبوه', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M  تطبيق سياسة جديدة', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M تطبيق سياسة جديدة', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE:M لقد تم تسجيلك في مختصون أعمال السلامة في الجهات الحكومية', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW: "التصنيف السعودى للجامعات وتعزيز جودة التعليم والتعلم والمواءمة مع سوق العمل بمشاركة أصحاب المصلحة " at المؤتمر السادس للشبكة العربية لضمان الجودة في التعليم العالي', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW: الإبلاغ عن رسالة مشبوهة', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW:  الإبلاغ عن تسجيل الدخول إلى حسابنا من جهاز جديد', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW: [Phish Alert]', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M [Phish Alert] صفحتى الرئيسية: حساب مستخدم جديد', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE:  M [Phish Alert] [Attachment Too Large To Send]Emdadat Alatta Manpower Supply Services – Proposal for Collaboration', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M  [Phish Alert] التأكيد على بريدك الالكتروني', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M [Phish Alert] التأكيد على بريدك الالكتروني', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M [Phish Alert] نرحب بك في موقع COE للتوظيف', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: M -  التأكيد على بريدك الالكتروني', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'تغيير كلمة المرور', week: 'Week 3', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW: تغيير كلمة مرور AGI', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'FW: Fw: Invitation to Register on Misk Foundation Supplier Portal – Active Tender', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: [Not Virus Scanned] الدفعة السادسة من بيانات المطلوب اجراء اختبار كفايات الحرس الوطني', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' },
  { task: 'RE: [Not Virus Scanned] الدفعة الخامسة من بيانات المطلوب اجراء اختبار كفايات الحرس الوطني', week: 'Week 4', engineer: 'Milaf', service: 'Sec Investigations', status: 'Completed' }
];

try {
  console.log('📂 Reading November Excel file...\n');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  
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
    process.exit(1);
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
  console.log(`📝 Adding ${newTasks.length} new tasks...\n`);
  
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
    process.exit(1);
  }
  
  // Add new tasks
  for (const task of newTasks) {
    const newRow = [];
    
    // Initialize row with empty cells up to the maximum column needed
    const maxCol = Math.max(taskCol, engineerCol, serviceCol, weekCol, statusCol);
    for (let i = 0; i <= maxCol; i++) {
      newRow[i] = '';
    }
    
    // Fill in the task data
    if (taskCol >= 0) newRow[taskCol] = task.task;
    if (weekCol >= 0) newRow[weekCol] = task.week;
    if (engineerCol >= 0) newRow[engineerCol] = task.engineer;
    if (serviceCol >= 0) newRow[serviceCol] = task.service;
    if (statusCol >= 0) newRow[statusCol] = task.status;
    
    // Add the row after the last data row
    data.splice(lastDataRow + 1, 0, newRow);
    lastDataRow++;
    
    console.log(`   ✅ Added: "${task.task}" - ${task.engineer} - ${task.service} - ${task.week} - ${task.status}`);
  }
  
  // Convert back to worksheet
  const newSheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newSheet;
  
  // Write the file
  XLSX.writeFile(workbook, filePath);
  
  console.log(`\n✨ Successfully added ${newTasks.length} tasks to the November Excel file!`);
  console.log(`📁 File saved: ${filePath}`);
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

