const { Pool } = require('pg');

// Use environment variables or defaults for Docker container
const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function completeDossariTasks() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Updating all S.Dossari tasks to completed status...\n');
    
    const engineerName = 'S.Dossari';
    
    // Get count of tasks to be updated
    const countResult = await client.query(
      'SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND status != $2',
      [engineerName, 'completed']
    );
    const tasksToUpdate = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Found ${tasksToUpdate} tasks to update for ${engineerName}\n`);
    
    if (tasksToUpdate === 0) {
      console.log('✅ All tasks are already completed!');
      await client.query('COMMIT');
      return;
    }
    
    // Update all tasks to completed
    const updateResult = await client.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE engineer = $2 AND status != $1',
      ['completed', engineerName]
    );
    
    const updatedCount = updateResult.rowCount;
    
    // Update engineer task count (though it shouldn't change, just to be safe)
    await client.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
      [engineerName]
    );
    
    await client.query('COMMIT');
    
    console.log(`\n✨ Successfully updated ${updatedCount} tasks to completed status for ${engineerName}!`);
    console.log(`📊 All tasks for ${engineerName} are now marked as completed.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating tasks:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
completeDossariTasks()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

