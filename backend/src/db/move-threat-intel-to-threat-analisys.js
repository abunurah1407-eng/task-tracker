const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveThreatIntelToThreatAnalisys() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "threat intel" and "Threat Analisys" services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('threat intel', 'Threat Analisys') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "threat intel" or "Threat Analisys" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'threat intel');
    const targetService = servicesResult.rows.find(s => s.name === 'Threat Analisys');
    
    if (!sourceService) {
      console.log('✅ No "threat intel" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Threat Analisys" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "threat intel" (ID: ${sourceService.id}) to "Threat Analisys" (ID: ${targetService.id})...\n`);
    
    // Count tasks with threat intel
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['threat intel']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "threat intel"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from threat intel to Threat Analisys
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Threat Analisys', 'threat intel']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "threat intel" to "Threat Analisys"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Threat Analisys count
    const threatAnalisysCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Threat Analisys']
    );
    const threatAnalisysCount = parseInt(threatAnalisysCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [threatAnalisysCount, targetService.id]
    );
    console.log(`   ✅ Updated "Threat Analisys" count to ${threatAnalisysCount}`);
    
    // Delete the threat intel service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "threat intel" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "threat intel" service (ID: ${sourceService.id})`);
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

moveThreatIntelToThreatAnalisys()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

