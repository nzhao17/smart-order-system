import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './shared/schema';

let db: ReturnType<typeof drizzle> | null = null;

/**
 * 获取数据库连接
 */
export function getDb() {
  if (db) return db;

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Please configure your PostgreSQL connection string.');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  db = drizzle(pool, { schema });
  
  return db;
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    await pool.query('SELECT NOW()');
    await pool.end();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
