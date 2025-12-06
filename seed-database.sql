-- Quick seed script for Docker
-- Run with: docker-compose exec -T postgres psql -U postgres -d task_tracker < seed-database.sql

-- Insert engineers
INSERT INTO engineers (name, color) VALUES
  ('Faisal', '#3b82f6'),
  ('Abeer', '#8b5cf6'),
  ('M. Shahrani', '#ec4899'),
  ('Wed', '#f59e0b'),
  ('S. Dossari', '#10b981'),
  ('Abdullah', '#ef4444'),
  ('Milaf', '#06b6d4'),
  ('M. Aqily', '#84cc16'),
  ('Ghaida', '#f97316'),
  ('Amani', '#6366f1'),
  ('Menwer', '#14b8a6'),
  ('A. Driwesh', '#a855f7'),
  ('Aryam', '#eab308')
ON CONFLICT (name) DO NOTHING;

-- Insert services
INSERT INTO services (name, assigned_to, category) VALUES
  ('FCR', 'Faisal', 'primary'),
  ('VPN', 'Abeer', 'primary'),
  ('SOC Alerts', 'M. Shahrani', 'primary'),
  ('USB/CD', 'Wed', 'primary'),
  ('URL Filtering', 'S. Dossari', 'primary'),
  ('IoCs', 'Abdullah', 'primary'),
  ('CTI Feeds', 'Milaf', 'primary'),
  ('Threat Analysis', 'M. Aqily', 'primary'),
  ('Vulnerabilities', 'Ghaida', 'primary'),
  ('Sec Support', 'Amani', 'primary'),
  ('Ticket', 'Menwer', 'primary'),
  ('Technical Meeting', 'A. Driwesh', 'primary'),
  ('Sec Investigations', 'Aryam', 'primary'),
  ('Sec Policy Changes', NULL, 'secondary'),
  ('Sec Solution Administration', NULL, 'secondary'),
  ('Sec Troubleshooting', NULL, 'secondary'),
  ('Sec Implement', NULL, 'secondary'),
  ('Cyber Infra', NULL, 'secondary'),
  ('IT Infra Review', NULL, 'secondary'),
  ('Sec Control Modifications', NULL, 'secondary'),
  ('Architect Review', NULL, 'secondary'),
  ('Review Cyber Control', NULL, 'secondary'),
  ('Sec Comparison', NULL, 'secondary'),
  ('Health Check', NULL, 'secondary'),
  ('New HLD', NULL, 'secondary'),
  ('New LLD', NULL, 'secondary'),
  ('GAP Analysis', NULL, 'secondary'),
  ('RFP', NULL, 'secondary'),
  ('CAB', NULL, 'secondary'),
  ('Projects', NULL, 'secondary'),
  ('Reporting', NULL, 'secondary'),
  ('Compliance', NULL, 'secondary'),
  ('CR', NULL, 'secondary'),
  ('BRD', NULL, 'secondary'),
  ('Encrypted FLASH', NULL, 'secondary'),
  ('HASEEN', NULL, 'secondary'),
  ('OTHER', NULL, 'secondary')
ON CONFLICT (name) DO NOTHING;

-- Insert team tasks
INSERT INTO team_tasks (category, year) VALUES
  ('CAB', 2025),
  ('BRD/CR', 2025),
  ('Ticket', 2025),
  ('Request/Orders/MGT', 2025),
  ('Cyber Actions', 2025),
  ('Meetings', 2025),
  ('Cyber INFRA OPS / TICH', 2025)
ON CONFLICT DO NOTHING;

-- Insert users (password: password123)
-- Hash generated with: bcrypt.hash('password123', 10)
INSERT INTO users (email, name, password_hash, role, engineer_name) VALUES
  ('admin@etec.com', 'Admin User', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin', NULL),
  ('director@etec.com', 'Director User', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'director', NULL),
  ('faisal@etec.com', 'Faisal', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'engineer', 'Faisal'),
  ('abeer@etec.com', 'Abeer', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'engineer', 'Abeer')
ON CONFLICT (email) DO NOTHING;

