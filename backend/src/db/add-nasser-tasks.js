const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

const tasksData = [
  { service: 'CAB', count: 157 },
  { service: 'BRD', count: 20 },
  { service: 'Ticket', count: 400 },
  { service: 'Request', count: 51 },
  { service: 'Orders', count: 30 },
  { service: 'MGT', count: 41 },
  { service: 'Cyber Actions', count: 95 },
  { service: 'Meetings', count: 90 },
  { service: 'Cyber INFRA', count: 45 },
  { service: 'SOC OPS', count: 95 },
  { service: 'Technical Support', count: 55 },
  { service: 'CR', count: 20 },
  { service: 'HASEEN', count: 20 },
  { service: 'Project', count: 11 },
  { service: 'Incident', count: 25 },
  { service: 'Arch', count: 35 },
  { service: 'USB ENCRYPT', count: 40 },
  { service: 'GAP', count: 15 },
  { service: 'FCR Approvals', count: 60 },
  { service: 'Complaince', count: 95 },
];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weeks = [1, 2, 3, 4];
const engineer = 'Nasser';
const year = 2025;
const status = 'completed';
const priority = 'medium';

async function addNasserTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if Nasser engineer exists
    const engineerCheck = await client.query('SELECT id FROM engineers WHERE name = $1', [engineer]);
    if (engineerCheck.rows.length === 0) {
      console.log(`Engineer "${engineer}" not found. Creating...`);
      await client.query('INSERT INTO engineers (name, color) VALUES ($1, $2)', [engineer, '#dc2626']);
    }

    let totalCreated = 0;

    for (const { service, count } of tasksData) {
      // Check if service exists, if not create it
      const serviceCheck = await client.query('SELECT id FROM services WHERE name = $1', [service]);
      if (serviceCheck.rows.length === 0) {
        console.log(`Service "${service}" not found. Creating...`);
        await client.query(
          'INSERT INTO services (name, category, assigned_to) VALUES ($1, $2, $3)',
          [service, 'secondary', null]
        );
      }

      // Create tasks for this service
      for (let i = 0; i < count; i++) {
        const randomMonth = months[Math.floor(Math.random() * months.length)];
        const randomWeek = weeks[Math.floor(Math.random() * weeks.length)];

        await client.query(
          `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [service, engineer, randomWeek, randomMonth, year, status, priority, null]
        );
        totalCreated++;
      }

      console.log(`Created ${count} tasks for service "${service}"`);
    }

    // Update engineer task count
    await client.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
      [engineer]
    );

    // Update service counts
    for (const { service } of tasksData) {
      await client.query(
        'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1 AND deleted_at IS NULL) WHERE name = $1',
        [service]
      );
    }

    await client.query('COMMIT');
    console.log(`\n✅ Successfully created ${totalCreated} tasks for ${engineer}!`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addNasserTasks();

