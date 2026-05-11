-- ADHD Focus App - Database Schema
-- Cloudflare D1 SQLite

-- 家长用户表
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  theme TEXT NOT NULL DEFAULT 'egg',  -- 'egg' or 'minecraft'
  children_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  is_admin INTEGER DEFAULT 0,        -- 超级管理员标记
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 孩子表
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  birth_date TEXT,
  grade TEXT,                        -- 年级
  gender TEXT,                       -- 'boy' or 'girl'
  total_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,    -- 连续打卡天数
  last_checkin_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- 每日打卡记录
CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,        -- YYYY-MM-DD
  points_earned INTEGER DEFAULT 0,
  games_completed INTEGER DEFAULT 0,
  homework_completed INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE(child_id, checkin_date)
);

-- 小游戏记录
CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  game_type TEXT NOT NULL,            -- 'memory_digits', 'listen_commands', 'schulte_grid', 'spot_diff', 'sequence_memory'
  checkin_date TEXT NOT NULL,         -- YYYY-MM-DD
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 1,
  extra_data TEXT,                    -- JSON for game-specific data
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- 作业任务表
CREATE TABLE IF NOT EXISTS homework_tasks (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,              -- 'chinese', 'math', 'english', 'other'
  estimated_minutes INTEGER DEFAULT 15,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- 作业完成记录
CREATE TABLE IF NOT EXISTS homework_records (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  focus_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES homework_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- 奖励库（家长自定义）
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  cost_points INTEGER DEFAULT 10,
  reward_type TEXT DEFAULT 'item',    -- 'item', 'privilege', 'activity'
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- 大转盘抽奖记录
CREATE TABLE IF NOT EXISTS spin_records (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  reward_id TEXT,
  reward_name TEXT NOT NULL,
  points_spent INTEGER DEFAULT 10,
  spin_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE SET NULL
);

-- 积分变更记录
CREATE TABLE IF NOT EXISTS point_transactions (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,     -- 'game', 'homework', 'checkin_bonus', 'spin_cost', 'reward_spend', 'admin_add', 'admin_deduct'
  reference_id TEXT,                  -- optional link to game/homework/spin record
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- 勋章表
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,           -- 'streak_7', 'streak_30', 'master_game', 'homework_king', etc.
  badge_name TEXT NOT NULL,
  earned_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- 会话表（用于 next-auth / 自定义 session）
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_checkins_child_date ON daily_checkins(child_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_games_child_date ON game_records(child_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_games_type_date ON game_records(game_type, checkin_date);
CREATE INDEX IF NOT EXISTS idx_homework_child ON homework_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_homework_records_date ON homework_records(child_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_rewards_parent ON rewards(parent_id);
CREATE INDEX IF NOT EXISTS idx_spins_child ON spin_records(child_id);
CREATE INDEX IF NOT EXISTS idx_points_child ON point_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_badges_child ON badges(child_id);
