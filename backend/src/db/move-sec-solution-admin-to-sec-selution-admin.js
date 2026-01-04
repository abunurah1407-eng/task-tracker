const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveSecSolutionAdminToSecSelutionAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "Sec Solution Administration" and "Sec Selution Administration" services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('Sec Solution Administration', 'Sec Selution Administration') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "Sec Solution Administration" or "Sec Selution Administration" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'Sec Solution Administration');
    const targetService = servicesResult.rows.find(s => s.name === 'Sec Selution Administration');
    
    if (!sourceService) {
      console.log('✅ No "Sec Solution Administration" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Sec Selution Administration" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "Sec Solution Administration" (ID: ${sourceService.id}) to "Sec Selution Administration" (ID: ${targetService.id})...\n`);
    
    // Count tasks with Sec Solution Administration
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Sec Solution Administration']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "Sec Solution Administration"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from Sec Solution Administration to Sec Selution Administration
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Sec Selution Administration', 'Sec Solution Administration']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "Sec Solution Administration" to "Sec Selution Administration"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Sec Selution Administration count
    const secSelutionCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Sec Selution Administration']
    );
    const secSelutionCount = parseInt(secSelutionCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [secSelutionCount, targetService.id]
    );
    console.log(`   ✅ Updated "Sec Selution Administration" count to ${secSelutionCount}`);
    
    // Delete the Sec Solution Administration service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "Sec Solution Administration" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "Sec Solution Administration" service (ID: ${sourceService.id})`);
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

moveSecSolutionAdminToSecSelutionAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

