// Update services from secondary to primary category
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Services to update from secondary to primary (based on the image)
const servicesToUpdate = [
  'Complaince', // Note: keeping the spelling as it appears in the image
  'Cyber Actions',
  'Cyber INFRA',
  'FCR Approvals',
  'GAP',
  'Incident',
  'MGT',
  'Meetings',
  'Orders',
  'Project',
  'Request',
  'SOC OPS',
  'Technical Support',
  'USB ENCRYPT'
];

async function updateServicesCategory() {
  try {
    console.log('Updating services from secondary to primary category...\n');

    for (const serviceName of servicesToUpdate) {
      // First, check if service exists and get its current category
      const checkResult = await pool.query(
        'SELECT id, name, category FROM services WHERE name = $1',
        [serviceName]
      );

      if (checkResult.rows.length === 0) {
        console.log(`⚠ Service "${serviceName}" not found. Skipping...`);
        continue;
      }

      const service = checkResult.rows[0];
      
      if (service.category === 'primary') {
        console.log(`✓ Service "${serviceName}" is already primary. Skipping...`);
        continue;
      }

      // Update the category
      const updateResult = await pool.query(
        'UPDATE services SET category = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2 RETURNING *',
        ['primary', serviceName]
      );

      if (updateResult.rows.length > 0) {
        console.log(`✓ Updated "${serviceName}" from secondary to primary`);
      } else {
        console.log(`✗ Failed to update "${serviceName}"`);
      }
    }

    console.log('\n✅ Update completed!');
    
    // Show summary
    const summary = await pool.query(
      'SELECT category, COUNT(*) as count FROM services GROUP BY category ORDER BY category'
    );
    
    console.log('\nSummary:');
    summary.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} services`);
    });

  } catch (error) {
    console.error('Error updating services:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateServicesCategory();

