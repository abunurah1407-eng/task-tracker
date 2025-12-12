const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveOtherToOtherAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "other" and "OTHER" services...\n');
    
    // Find both services (case-insensitive search first)
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name ILIKE 'other' ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "other" or "OTHER" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'other');
    const targetService = servicesResult.rows.find(s => s.name === 'OTHER');
    
    if (!sourceService) {
      console.log('✅ No "other" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "OTHER" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "other" (ID: ${sourceService.id}) to "OTHER" (ID: ${targetService.id})...\n`);
    
    // Count tasks with other
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['other']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "other"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from other to OTHER
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['OTHER', 'other']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "other" to "OTHER"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update OTHER count
    const otherCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['OTHER']
    );
    const otherCount = parseInt(otherCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [otherCount, targetService.id]
    );
    console.log(`   ✅ Updated "OTHER" count to ${otherCount}`);
    
    // Delete the other service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "other" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "other" service (ID: ${sourceService.id})`);
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

moveOtherToOtherAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

