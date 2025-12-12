const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveIOCsToIoCs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for IOCs and IoCs services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('IOCs', 'IoCs') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No IOCs or IoCs services found!');
      return;
    }
    
    const iocsService = servicesResult.rows.find(s => s.name === 'IOCs');
    const iocsServiceCorrect = servicesResult.rows.find(s => s.name === 'IoCs');
    
    if (!iocsService) {
      console.log('✅ No "IOCs" service found. Nothing to move.');
      return;
    }
    
    if (!iocsServiceCorrect) {
      console.log('❌ "IoCs" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "IOCs" (ID: ${iocsService.id}) to "IoCs" (ID: ${iocsServiceCorrect.id})...\n`);
    
    // Count tasks with IOCs
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['IOCs']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "IOCs"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from IOCs to IoCs
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['IoCs', 'IOCs']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "IOCs" to "IoCs"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update IoCs count
    const iocsCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['IoCs']
    );
    const iocsCount = parseInt(iocsCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [iocsCount, iocsServiceCorrect.id]
    );
    console.log(`   ✅ Updated "IoCs" count to ${iocsCount}`);
    
    // Delete the IOCs service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "IOCs" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [iocsService.id]);
      console.log(`   ✅ Deleted "IOCs" service (ID: ${iocsService.id})`);
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

moveIOCsToIoCs()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

