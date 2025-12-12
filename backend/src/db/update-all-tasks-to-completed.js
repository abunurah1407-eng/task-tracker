const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_tracker',
  port: 5432,
});

async function updateAllTasksToCompleted() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating all tasks to completed status...\n');
    
    // Count tasks that are not completed
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'`
    );
    const taskCount = parseInt(countResult.rows[0].count);
    
    console.log(`📝 Found ${taskCount} tasks that are not completed`);
    
    if (taskCount === 0) {
      console.log('✅ All tasks are already completed!');
      return;
    }
    
    // Update all tasks to completed
    const updateResult = await client.query(
      `UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE status != 'completed'`
    );
    
    console.log(`✅ Updated ${updateResult.rowCount} tasks to completed status`);
    
    // Verify the update
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'`
    );
    const remainingCount = parseInt(verifyResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('\n✨ All tasks are now completed!');
    } else {
      console.log(`\n⚠️  Warning: ${remainingCount} tasks are still not completed`);
    }
    
    // Get total task count
    const totalResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks`
    );
    const totalCount = parseInt(totalResult.rows[0].count);
    
    console.log(`\n📊 Total tasks in database: ${totalCount}`);
    console.log(`✅ Completed tasks: ${totalCount - remainingCount}`);
    
    console.log('\n✨ Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateAllTasksToCompleted()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

