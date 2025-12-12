const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveSecImplementationToSecImplemnt() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "Sec Implementation" and "Sec Implemnt" services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('Sec Implementation', 'Sec Implemnt') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "Sec Implementation" or "Sec Implemnt" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'Sec Implementation');
    const targetService = servicesResult.rows.find(s => s.name === 'Sec Implemnt');
    
    if (!sourceService) {
      console.log('✅ No "Sec Implementation" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Sec Implemnt" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "Sec Implementation" (ID: ${sourceService.id}) to "Sec Implemnt" (ID: ${targetService.id})...\n`);
    
    // Count tasks with Sec Implementation
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Sec Implementation']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "Sec Implementation"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from Sec Implementation to Sec Implemnt
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Sec Implemnt', 'Sec Implementation']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "Sec Implementation" to "Sec Implemnt"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Sec Implemnt count
    const secImplemntCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Sec Implemnt']
    );
    const secImplemntCount = parseInt(secImplemntCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [secImplemntCount, targetService.id]
    );
    console.log(`   ✅ Updated "Sec Implemnt" count to ${secImplemntCount}`);
    
    // Delete the Sec Implementation service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "Sec Implementation" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "Sec Implementation" service (ID: ${sourceService.id})`);
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

moveSecImplementationToSecImplemnt()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

