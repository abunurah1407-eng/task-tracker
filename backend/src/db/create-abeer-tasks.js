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
  'Security awareness campaign'
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

async function createAbeerTasks() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🎲 Creating random tasks for Abeer for all months in 2025...\n');
    
    // Get all services
    const services = await getServices();
    if (services.length === 0) {
      console.error('❌ No services found in database. Please seed services first.');
      return;
    }
    
    console.log(`📋 Found ${services.length} services\n`);
    
    const engineerName = 'Abeer';
    const year = 2025;
    let totalTasks = 0;
    
    // Create tasks for each month
    for (const month of months) {
      console.log(`📅 Processing ${month} ${year}...`);
      
      // Generate 5-15 tasks per month (random distribution)
      const tasksPerMonth = getRandomInt(5, 15);
      const monthTasks = [];
      
      for (let i = 0; i < tasksPerMonth; i++) {
        const week = getRandomInt(1, 4);
        const service = getRandomElement(services);
        const status = getRandomElement(statuses);
        const priority = getRandomElement(priorities);
        const description = getRandomElement(taskDescriptions);
        
        monthTasks.push({
          service,
          engineer: engineerName,
          week,
          month,
          year,
          status,
          priority,
          description
        });
      }
      
      // Insert tasks for this month
      let inserted = 0;
      for (const task of monthTasks) {
        try {
          await client.query(
            `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [task.service, task.engineer, task.week, task.month, task.year, task.status, task.priority, task.description]
          );
          inserted++;
        } catch (error) {
          console.error(`   ⚠️  Error inserting task: ${error.message}`);
        }
      }
      
      totalTasks += inserted;
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
    
    console.log(`\n✨ Successfully created ${totalTasks} tasks for ${engineerName} across all 12 months in ${year}!`);
    console.log(`📊 Tasks distributed across ${months.length} months`);
    
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
createAbeerTasks()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

