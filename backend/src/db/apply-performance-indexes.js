// Quick script to apply performance indexes
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

async function applyIndexes() {
  try {
    console.log('🔄 Applying performance indexes...');
    
    const indexesPath = path.join(__dirname, 'migration_add_performance_indexes.sql');
    const indexes = fs.readFileSync(indexesPath, 'utf-8');
    
    await pool.query(indexes);
    
    console.log('✅ Performance indexes applied successfully!');
    console.log('📊 Query performance should be significantly improved.');
  } catch (error) {
    console.error('❌ Failed to apply indexes:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Indexes already exist, that\'s okay!');
    }
  } finally {
    await pool.end();
  }
}

applyIndexes();

