// Core data types for ADHD Focus App

export interface Parent {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  theme: 'egg' | 'minecraft';
  is_active: number;
  is_admin: number;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  nickname?: string;
  avatar?: string;
  birth_date?: string;
  grade?: string;
  gender?: 'boy' | 'girl';
  total_points: number;
  streak_days: number;
  last_checkin_date?: string;
}

export interface DailyCheckin {
  id: string;
  child_id: string;
  checkin_date: string;
  points_earned: number;
  games_completed: number;
  homework_completed: number;
  focus_minutes: number;
}

export type GameType = 'memory_digits' | 'listen_commands' | 'schulte_grid' | 'spot_diff' | 'sequence_memory';

export interface GameRecord {
  id: string;
  child_id: string;
  game_type: GameType;
  checkin_date: string;
  score: number;
  level: number;
  duration_seconds: number;
  completed: number;
  extra_data?: string;
}

export interface HomeworkTask {
  id: string;
  child_id: string;
  parent_id: string;
  title: string;
  subject: 'chinese' | 'math' | 'english' | 'other';
  estimated_minutes: number;
  sort_order: number;
  is_active: number;
}

export interface HomeworkRecord {
  id: string;
  task_id: string;
  child_id: string;
  checkin_date: string;
  focus_minutes: number;
  points_earned: number;
  completed: number;
}

export interface Reward {
  id: string;
  parent_id: string;
  name: string;
  description?: string;
  icon?: string;
  cost_points: number;
  reward_type: 'item' | 'privilege' | 'activity';
  is_active: number;
}

export interface SpinRecord {
  id: string;
  child_id: string;
  reward_id?: string;
  reward_name: string;
  points_spent: number;
  spin_date: string;
}

export interface PointTransaction {
  id: string;
  child_id: string;
  points: number;
  transaction_type: 'game' | 'homework' | 'checkin_bonus' | 'spin_cost' | 'reward_spend' | 'admin_add' | 'admin_deduct';
  reference_id?: string;
  note?: string;
}

export interface Badge {
  id: string;
  child_id: string;
  badge_type: string;
  badge_name: string;
  earned_date: string;
}
