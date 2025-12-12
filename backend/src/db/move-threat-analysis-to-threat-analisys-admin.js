const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveThreatAnalysisToThreatAnalisysAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "Threat Analysis" and "Threat Analisys" services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('Threat Analysis', 'Threat Analisys') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "Threat Analysis" or "Threat Analisys" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'Threat Analysis');
    const targetService = servicesResult.rows.find(s => s.name === 'Threat Analisys');
    
    if (!sourceService) {
      console.log('✅ No "Threat Analysis" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Threat Analisys" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "Threat Analysis" (ID: ${sourceService.id}) to "Threat Analisys" (ID: ${targetService.id})...\n`);
    
    // Count tasks with Threat Analysis
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Threat Analysis']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "Threat Analysis"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from Threat Analysis to Threat Analisys
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Threat Analisys', 'Threat Analysis']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "Threat Analysis" to "Threat Analisys"`);
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
    
    // Delete the Threat Analysis service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "Threat Analysis" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "Threat Analysis" service (ID: ${sourceService.id})`);
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

moveThreatAnalysisToThreatAnalisysAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

