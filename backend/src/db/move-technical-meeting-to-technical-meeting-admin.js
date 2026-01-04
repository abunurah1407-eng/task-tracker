const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function moveTechnicalMeetingToTechnicalMeetingAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for "Technical meeting" and "Technical Meeting" services...\n');
    
    // Find both services (case-insensitive search first)
    const servicesResult = await client.query(
      `SELECT id, name FROM services WHERE name ILIKE '%technical meeting%' ORDER BY name`
    );
    
    console.log('📋 Found services:');
    servicesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id}, Name: "${s.name}"`);
    });
    
    if (servicesResult.rows.length === 0) {
      console.log('❌ No "Technical meeting" or "Technical Meeting" services found!');
      return;
    }
    
    const sourceService = servicesResult.rows.find(s => s.name === 'Technical meeting');
    const targetService = servicesResult.rows.find(s => s.name === 'Technical Meeting');
    
    if (!sourceService) {
      console.log('✅ No "Technical meeting" service found. Nothing to move.');
      return;
    }
    
    if (!targetService) {
      console.log('❌ "Technical Meeting" service not found! Cannot move tasks.');
      return;
    }
    
    console.log(`\n📊 Moving tasks from "Technical meeting" (ID: ${sourceService.id}) to "Technical Meeting" (ID: ${targetService.id})...\n`);
    
    // Count tasks with Technical meeting
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Technical meeting']
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks with service "Technical meeting"`);
    
    let updateResult = null;
    if (taskCount === 0) {
      console.log('✅ No tasks to move.');
    } else {
      // Update all tasks from Technical meeting to Technical Meeting
      updateResult = await client.query(
        `UPDATE tasks SET service = $1, updated_at = CURRENT_TIMESTAMP WHERE service = $2`,
        ['Technical Meeting', 'Technical meeting']
      );
      
      console.log(`✅ Updated ${updateResult.rowCount} tasks from "Technical meeting" to "Technical Meeting"`);
    }
    
    // Update service counts
    console.log('\n🔄 Updating service task counts...');
    
    // Update Technical Meeting count
    const technicalMeetingCountResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE service = $1`,
      ['Technical Meeting']
    );
    const technicalMeetingCount = parseInt(technicalMeetingCountResult.rows[0].count);
    
    await client.query(
      `UPDATE services SET count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [technicalMeetingCount, targetService.id]
    );
    console.log(`   ✅ Updated "Technical Meeting" count to ${technicalMeetingCount}`);
    
    // Delete the Technical meeting service if it has no tasks
    if (taskCount === 0 || (updateResult && updateResult.rowCount === taskCount)) {
      console.log('\n🗑️  Deleting "Technical meeting" service...');
      await client.query(`DELETE FROM services WHERE id = $1`, [sourceService.id]);
      console.log(`   ✅ Deleted "Technical meeting" service (ID: ${sourceService.id})`);
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

moveTechnicalMeetingToTechnicalMeetingAdmin()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

