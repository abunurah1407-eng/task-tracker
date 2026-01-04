const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-tracker-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function updatePendingToCompleted() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Updating all pending tasks to completed status...\n');
    
    // First, count pending tasks
    const countResult = await client.query(
      `SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND deleted_at IS NULL`
    );
    const pendingCount = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Found ${pendingCount} pending tasks\n`);
    
    if (pendingCount === 0) {
      console.log('✅ No pending tasks to update');
      await client.query('COMMIT');
      return;
    }
    
    // Update all pending tasks to completed
    const updateResult = await client.query(
      `UPDATE tasks 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
       WHERE status = 'pending' AND deleted_at IS NULL`
    );
    
    console.log(`✅ Successfully updated ${updateResult.rowCount} tasks from pending to completed\n`);
    
    // Update engineer task counts
    console.log('📊 Updating engineer task counts...');
    await client.query(`
      UPDATE engineers e
      SET tasks_total = (
        SELECT COUNT(*) 
        FROM tasks t 
        WHERE t.engineer = e.name 
        AND t.deleted_at IS NULL
      )
    `);
    console.log('✅ Engineer task counts updated\n');
    
    // Update service task counts
    console.log('📊 Updating service task counts...');
    await client.query(`
      UPDATE services s
      SET count = (
        SELECT COUNT(*) 
        FROM tasks t 
        WHERE t.service = s.name 
        AND t.deleted_at IS NULL
      )
    `);
    console.log('✅ Service task counts updated\n');
    
    await client.query('COMMIT');
    
    console.log('✨ All pending tasks have been updated to completed status!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updatePendingToCompleted()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

