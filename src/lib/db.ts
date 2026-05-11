// Database client for Cloudflare D1
// In dev: uses local SQLite (via better-sqlite3)
// In production: uses Cloudflare D1 binding

export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  AUTH_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
}

let _db: D1Database | null = null;

/** Get the Cloudflare runtime env context (D1, KV, etc.) */
function getCloudflareEnv(): Record<string, any> {
  // OpenNext stores the Cloudflare env in AsyncLocalStorage
  try {
    const ctx = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    if (ctx?.env) return ctx.env;
  } catch {}
  // Fallback: check process.env as provided by OpenNext init
  return process.env as any;
}

export function getDB(): D1Database {
  if (_db) return _db!;

  // Try Cloudflare runtime env (D1 binding is an object, not string)
  const cloudflareEnv = getCloudflareEnv();
  if (cloudflareEnv.DB) {
    _db = cloudflareEnv.DB;
    return _db!;
  }

  // Fallback: try process.env (OpenNext populates string-typed bindings there)
  const processEnv = process.env as any;
  if (processEnv.DB) {
    _db = processEnv.DB;
    return _db!;
  }

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
