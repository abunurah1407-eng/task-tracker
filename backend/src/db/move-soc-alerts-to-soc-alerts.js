const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveSOCAlertsToSOCAlerts() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "SOC alerts" and "SOC Alerts" services...\n');
    
    // Find both services (case-sensitive search)
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('SOC alerts', 'SOC Alerts') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "SOC alerts" or "SOC Alerts" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'SOC alerts');
    const targetService = servicesResult.rows.find(s => s.name === 'SOC Alerts');
    
    if (!sourceService) {
      console.log('✅ No "SOC alerts" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "SOC Alerts" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "SOC alerts" (ID: ${sourceService.id}) to "SOC Alerts" (ID: ${targetService.id})...\n`);
    
    // Count tasks with SOC alerts
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['SOC alerts']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "SOC alerts"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from SOC alerts to SOC Alerts
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['SOC Alerts', 'SOC alerts']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "SOC alerts" to "SOC Alerts"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update SOC Alerts count
    const socAlertsCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['SOC Alerts']
    );
    const socAlertsCount = parseInt(socAlertsCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [socAlertsCount, targetService.id]
    );
    console.log(`   ✅ Updated "SOC Alerts" count to ${socAlertsCount}`);
    
    // Delete the SOC alerts service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "SOC alerts" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "SOC alerts" service (ID: ${sourceService.id})`);
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

moveSOCAlertsToSOCAlerts()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

