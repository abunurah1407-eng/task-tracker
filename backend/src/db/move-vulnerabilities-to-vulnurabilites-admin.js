const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveVulnerabilitiesToVulnurabilitesAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "Vulnerabilities" and "Vulnurabilites" services...\n');
    
    // Find both services
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name IN ('Vulnerabilities', 'Vulnurabilites') ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "Vulnerabilities" or "Vulnurabilites" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'Vulnerabilities');
    const targetService = servicesResult.rows.find(s => s.name === 'Vulnurabilites');
    
    if (!sourceService) {
      console.log('✅ No "Vulnerabilities" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Vulnurabilites" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "Vulnerabilities" (ID: ${sourceService.id}) to "Vulnurabilites" (ID: ${targetService.id})...\n`);
    
    // Count tasks with Vulnerabilities
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Vulnerabilities']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "Vulnerabilities"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from Vulnerabilities to Vulnurabilites
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Vulnurabilites', 'Vulnerabilities']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "Vulnerabilities" to "Vulnurabilites"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Vulnurabilites count
    const vulnurabilitesCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Vulnurabilites']
    );
    const vulnurabilitesCount = parseInt(vulnurabilitesCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [vulnurabilitesCount, targetService.id]
    );
    console.log(`   ✅ Updated "Vulnurabilites" count to ${vulnurabilitesCount}`);
    
    // Delete the Vulnerabilities service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "Vulnerabilities" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "Vulnerabilities" service (ID: ${sourceService.id})`);
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

moveVulnerabilitiesToVulnurabilitesAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

