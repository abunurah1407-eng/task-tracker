const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveReportingToReportingAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "reporting" and "Reporting" services...\n');
    
    // Find both services (case-insensitive search first)
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name ILIKE '%reporting%' ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "reporting" or "Reporting" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'reporting');
    const targetService = servicesResult.rows.find(s => s.name === 'Reporting');
    
    if (!sourceService) {
      console.log('✅ No "reporting" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Reporting" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "reporting" (ID: ${sourceService.id}) to "Reporting" (ID: ${targetService.id})...\n`);
    
    // Count tasks with reporting
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['reporting']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "reporting"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from reporting to Reporting
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Reporting', 'reporting']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "reporting" to "Reporting"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Reporting count
    const reportingCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Reporting']
    );
    const reportingCount = parseInt(reportingCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [reportingCount, targetService.id]
    );
    console.log(`   ✅ Updated "Reporting" count to ${reportingCount}`);
    
    // Delete the reporting service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "reporting" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "reporting" service (ID: ${sourceService.id})`);
    }
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

moveReportingToReportingAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

