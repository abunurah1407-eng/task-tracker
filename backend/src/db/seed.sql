-- Production Seed Data for Task Tracker
-- This file seeds the database with engineers, services, and users
-- Run automatically on first database initialization

-- Insert engineers
INSERT INTO engineers (name, color) VALUES
  ('Faisal AlAmmaj', '#3b82f6'),
  ('Abeer M. Al-Osaimi', '#8b5cf6'),
  ('Mohammed AlShahrani', '#ec4899'),
  ('Wed N Alrashed', '#f59e0b'),
  ('Sultan Aldossari', '#10b981'),
  ('Abdullah T. Al-Faleh', '#ef4444'),
  ('Milaf S. Al-Sahli', '#06b6d4'),
  ('Mohammed Ageeli', '#84cc16'),
  ('Ghaida AlOmair', '#f97316'),
  ('Amani AL-Swailem', '#6366f1'),
  ('Menwer AlShammari', '#14b8a6'),
  ('Abdulrahman Alderwish', '#a855f7'),
  ('Aryam Al-Ahmari', '#eab308')
ON CONFLICT (name) DO NOTHING;

-- Insert services
INSERT INTO services (name, assigned_to, category) VALUES
  ('FCR', 'Faisal AlAmmaj', 'primary'),
  ('VPN', 'Abeer M. Al-Osaimi', 'primary'),
  ('SOC Alerts', 'Mohammed AlShahrani', 'primary'),
  ('USB/CD', 'Wed N Alrashed', 'primary'),
  ('URL Filtering', 'Sultan Aldossari', 'primary'),
  ('IoCs', 'Abdullah T. Al-Faleh', 'primary'),
  ('CTI Feeds', 'Milaf S. Al-Sahli', 'primary'),
  ('Threat Analysis', 'Mohammed Ageeli', 'primary'),
  ('Vulnerabilities', 'Ghaida AlOmair', 'primary'),
  ('Sec Support', 'Amani AL-Swailem', 'primary'),
  ('Ticket', 'Menwer AlShammari', 'primary'),
  ('Technical Meeting', 'Abdulrahman Alderwish', 'primary'),
  ('Sec Investigations', 'Aryam Al-Ahmari', 'primary'),
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

-- Insert users (password: password123 for all users)
-- Password hash generated with bcrypt (cost: 10)
-- All emails are lowercase, engineer_name matches engineers.name (full names)
INSERT INTO users (email, name, password_hash, role, engineer_name) VALUES
  ('admin@etec.gov.sa', 'Admin User', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'admin', NULL),
  ('n.saleem@etec.gov.sa', 'Nasser M. Al-Saleem', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'director', NULL),
  ('f.ammaj@etec.gov.sa', 'Faisal AlAmmaj', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Faisal AlAmmaj'),
  ('a.osaimi@etec.gov.sa', 'Abeer M. Al-Osaimi', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Abeer M. Al-Osaimi'),
  ('m.shahrani@etec.gov.sa', 'Mohammed AlShahrani', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Mohammed AlShahrani'),
  ('w.rashed@etec.gov.sa', 'Wed N Alrashed', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Wed N Alrashed'),
  ('s.dossari@etec.gov.sa', 'Sultan Aldossari', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Sultan Aldossari'),
  ('a.tfaleh@etec.gov.sa', 'Abdullah T. Al-Faleh', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Abdullah T. Al-Faleh'),
  ('m.sahli@etec.gov.sa', 'Milaf S. Al-Sahli', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Milaf S. Al-Sahli'),
  ('m.ageeli@etec.gov.sa', 'Mohammed Ageeli', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Mohammed Ageeli'),
  ('g.omair@etec.gov.sa', 'Ghaida AlOmair', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Ghaida AlOmair'),
  ('a.nswailem@etec.gov.sa', 'Amani AL-Swailem', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Amani AL-Swailem'),
  ('m.hshammari@etec.gov.sa', 'Menwer AlShammari', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Menwer AlShammari'),
  ('a.derwish@etec.gov.sa', 'Abdulrahman Alderwish', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Abdulrahman Alderwish'),
  ('a.aaahmari@etec.gov.sa', 'Aryam Al-Ahmari', '$2a$10$8DLyLZvQTp/BgUM9Dra80uNXk0sCqFrMRZw/kk4QJpNnwLsz5DsRq', 'engineer', 'Aryam Al-Ahmari')
ON CONFLICT (email) DO NOTHING;

