-- Seed: Create super admin user
-- Password: admin123 (for first login, should be changed)
-- Run AFTER 001_initial.sql

INSERT OR IGNORE INTO parents (id, email, name, password_hash, is_admin, created_at, updated_at)
VALUES (
  'admin-001',
  'adhd@leoshum.com',
  '超级管理员',
  'admin123', -- TODO: hash this in production
  1,
  datetime('now'),
  datetime('now')
);
