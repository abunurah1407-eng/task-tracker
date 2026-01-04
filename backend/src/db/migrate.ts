import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Run main schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    
    // Run performance indexes migration
    try {
      const performanceIndexesPath = join(__dirname, 'migration_add_performance_indexes.sql');
      const performanceIndexes = readFileSync(performanceIndexesPath, 'utf-8');
      await pool.query(performanceIndexes);
      console.log('✅ Performance indexes applied');
    } catch (error: any) {
      // Indexes might already exist, that's okay
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Performance indexes already exist');
      } else {
        console.warn('⚠️  Could not apply performance indexes:', error.message);
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

