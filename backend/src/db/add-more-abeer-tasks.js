const { Pool } = require('pg');

// Use environment variables or defaults for Docker container
const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statuses = ['pending', 'in-progress', 'completed'];
const priorities = ['low', 'medium', 'high'];

const taskDescriptions = [
  'Security audit and vulnerability assessment',
  'Network infrastructure monitoring and analysis',
  'Firewall configuration and rule updates',
  'Incident response and threat investigation',
  'Security policy review and documentation',
  'Penetration testing and security assessment',
  'SIEM log analysis and correlation',
  'Endpoint protection deployment and updates',
  'Security awareness training preparation',
  'Compliance audit and reporting',
  'Malware analysis and remediation',
  'Access control review and updates',
  'Security patch management',
  'Data encryption implementation',
  'Backup and disaster recovery planning',
  'Security tool configuration and tuning',
  'Threat intelligence gathering',
  'Security metrics and KPI reporting',
  'Vulnerability scanning and remediation',
  'Security documentation and procedures',
  'Network segmentation review',
  'Identity and access management',
  'Security event monitoring',
  'Risk assessment and mitigation',
  'Security tool evaluation',
  'Compliance gap analysis',
  'Security architecture review',
  'Threat hunting activities',
  'Security automation implementation',
  'Security awareness campaign',
  'VPN configuration and maintenance',
  'Security incident documentation',
  'Security control testing',
  'Security training material development',
  'Security dashboard configuration',
  'Security report generation',
  'Security tool integration',
  'Security workflow optimization',
  'Security process improvement',
  'Security team coordination'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getServices() {
  const result = await pool.query('SELECT name FROM services');
  return result.rows.map(row => row.name);
}

async function addMoreAbeerTasks() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🎲 Adding 436 more random tasks for Abeer for all months in 2025...\n');
    
    // Get all services
    const services = await getServices();
    if (services.length === 0) {
      console.error('❌ No services found in database. Please seed services first.');
      return;
    }
    
    console.log(`📋 Found ${services.length} services\n`);
    
    const engineerName = 'Abeer';
    const year = 2025;
    const totalTasksToAdd = 436;
    
    // Distribute tasks across months (approximately equal distribution)
    const tasksPerMonth = Math.floor(totalTasksToAdd / 12);
    const remainder = totalTasksToAdd % 12;
    
    let totalInserted = 0;
    
    // Create tasks for each month
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const month = months[monthIndex];
      // Add remainder tasks to first few months
      const tasksForThisMonth = tasksPerMonth + (monthIndex < remainder ? 1 : 0);
      
      console.log(`📅 Processing ${month} ${year}... (${tasksForThisMonth} tasks)`);
      
      let inserted = 0;
      for (let i = 0; i < tasksForThisMonth; i++) {
        const week = getRandomInt(1, 4);
        const service = getRandomElement(services);
        const status = getRandomElement(statuses);
        const priority = getRandomElement(priorities);
        const description = getRandomElement(taskDescriptions);
        
        try {
          await client.query(
            `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [service, engineerName, week, month, year, status, priority, description]
          );
          inserted++;
        } catch (error) {
          console.error(`   ⚠️  Error inserting task: ${error.message}`);
        }
      }
      
      totalInserted += inserted;
      console.log(`   ✅ Created ${inserted} tasks for ${month}\n`);
    }
    
    // Update engineer task count
    await client.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
      [engineerName]
    );
    
    // Update service counts
    for (const service of services) {
      await client.query(
        'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1 AND deleted_at IS NULL) WHERE name = $1',
        [service]
      );
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✨ Successfully added ${totalInserted} tasks for ${engineerName}!`);
    console.log(`📊 Tasks distributed across ${months.length} months in ${year}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tasks:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addMoreAbeerTasks()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

