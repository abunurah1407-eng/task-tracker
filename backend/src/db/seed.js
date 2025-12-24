// Seed script that can run with node (no tsx needed)
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const defaultEngineers = [
  { name: 'Faisal', color: '#3b82f6' },
  { name: 'Abeer', color: '#8b5cf6' },
  { name: 'M. Shahrani', color: '#ec4899' },
  { name: 'Wed', color: '#f59e0b' },
  { name: 'S. Dossari', color: '#10b981' },
  { name: 'Abdullah', color: '#ef4444' },
  { name: 'Milaf', color: '#06b6d4' },
  { name: 'M. Aqily', color: '#84cc16' },
  { name: 'Ghaida', color: '#f97316' },
  { name: 'Amani', color: '#6366f1' },
  { name: 'Menwer', color: '#14b8a6' },
  { name: 'A. Driwesh', color: '#a855f7' },
  { name: 'Aryam', color: '#eab308' },
  { name: 'Nasser', color: '#dc2626' },
];

const defaultServices = [
  { name: 'FCR', assignedTo: 'Faisal', category: 'primary' },
  { name: 'VPN', assignedTo: 'Abeer', category: 'primary' },
  { name: 'SOC Alerts', assignedTo: 'M. Shahrani', category: 'primary' },
  { name: 'USB/CD', assignedTo: 'Wed', category: 'primary' },
  { name: 'URL Filtering', assignedTo: 'S. Dossari', category: 'primary' },
  { name: 'IoCs', assignedTo: 'Abdullah', category: 'primary' },
  { name: 'CTI Feeds', assignedTo: 'Milaf', category: 'primary' },
  { name: 'Threat Analysis', assignedTo: 'M. Aqily', category: 'primary' },
  { name: 'Vulnerabilities', assignedTo: 'Ghaida', category: 'primary' },
  { name: 'Sec Support', assignedTo: 'Amani', category: 'primary' },
  { name: 'Ticket', assignedTo: 'Menwer', category: 'primary' },
  { name: 'Technical Meeting', assignedTo: 'A. Driwesh', category: 'primary' },
  { name: 'Sec Investigations', assignedTo: 'Aryam', category: 'primary' },
  { name: 'Sec Policy Changes', category: 'secondary' },
  { name: 'Sec Solution Administration', category: 'secondary' },
  { name: 'Sec Troubleshooting', category: 'secondary' },
  { name: 'Sec Implement', category: 'secondary' },
  { name: 'Cyber Infra', category: 'secondary' },
  { name: 'IT Infra Review', category: 'secondary' },
  { name: 'Sec Control Modifications', category: 'secondary' },
  { name: 'Architect Review', category: 'secondary' },
  { name: 'Review Cyber Control', category: 'secondary' },
  { name: 'Sec Comparison', category: 'secondary' },
  { name: 'Health Check', category: 'secondary' },
  { name: 'New HLD', category: 'secondary' },
  { name: 'New LLD', category: 'secondary' },
  { name: 'GAP Analysis', category: 'secondary' },
  { name: 'RFP', category: 'secondary' },
  { name: 'CAB', category: 'secondary' },
  { name: 'Projects', category: 'secondary' },
  { name: 'Reporting', category: 'secondary' },
  { name: 'Compliance', category: 'secondary' },
  { name: 'CR', category: 'secondary' },
  { name: 'BRD', category: 'secondary' },
  { name: 'Encrypted FLASH', category: 'secondary' },
  { name: 'HASEEN', category: 'secondary' },
  { name: 'OTHER', category: 'secondary' },
];

const defaultTeamTasks = [
  { category: 'CAB', year: 2025 },
  { category: 'BRD/CR', year: 2025 },
  { category: 'Ticket', year: 2025 },
  { category: 'Request/Orders/MGT', year: 2025 },
  { category: 'Cyber Actions', year: 2025 },
  { category: 'Meetings', year: 2025 },
  { category: 'Cyber INFRA OPS / TICH', year: 2025 },
];

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding database...');
    
    // Seed engineers
    console.log('  → Seeding engineers...');
    for (const eng of defaultEngineers) {
      await client.query(
        'INSERT INTO engineers (name, color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [eng.name, eng.color]
      );
    }
    
    // Seed services
    console.log('  → Seeding services...');
    for (const svc of defaultServices) {
      await client.query(
        'INSERT INTO services (name, assigned_to, category) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [svc.name, svc.assignedTo || null, svc.category]
      );
    }
    
    // Seed team tasks
    console.log('  → Seeding team tasks...');
    for (const tt of defaultTeamTasks) {
      await client.query(
        'INSERT INTO team_tasks (category, year) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [tt.category, tt.year]
      );
    }
    
    // Seed default users
    console.log('  → Seeding users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const defaultUsers = [
      { email: 'admin@etec.com', name: 'Admin User', role: 'admin', passwordHash },
      { email: 'director@etec.com', name: 'Nasser', role: 'director', passwordHash },
      { email: 'faisal@etec.com', name: 'Faisal', role: 'engineer', engineerName: 'Faisal', passwordHash },
      { email: 'abeer@etec.com', name: 'Abeer', role: 'engineer', engineerName: 'Abeer', passwordHash },
    ];
    
    for (const user of defaultUsers) {
      await client.query(
        'INSERT INTO users (email, name, password_hash, role, engineer_name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        [user.email, user.name, user.passwordHash, user.role, user.engineerName || null]
      );
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seed();

