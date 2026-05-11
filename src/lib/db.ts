// Database client for Cloudflare D1
// In dev: uses local SQLite (via better-sqlite3)
// In production: uses Cloudflare D1 binding

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  AUTH_SECRET: string;
  AUTH_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
}

let _db: D1Database | null = null;

export function getDB(env?: Env): D1Database {
  if (env?.DB) {
    _db = env.DB;
    return _db;
  }
  if (_db) return _db;
  throw new Error('D1 database not available - check environment binding');
}

// Helper: generate UUID v4
export function uuid(): string {
  return crypto.randomUUID();
}

// Helper: get today's date string (Asia/Shanghai)
export function today(): string {
  const now = new Date();
  // Asia/Shanghai = UTC+8
  const offset = 8 * 60;
  const local = new Date(now.getTime() + offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

// Helper: current timestamp
export function now(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}
