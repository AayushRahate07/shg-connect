import { Pool as PgPool, PoolClient } from 'pg';
import { newDb } from 'pg-mem';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shgconnect';

let activePool: any = null;

function createInMemoryPgPool() {
  const memDb = newDb();
  // Register custom PostgreSQL sequence functions if needed
  const { Pool: MemPool } = memDb.adapters.createPg();
  const poolInstance = new MemPool();
  
  // Seed DDL schema into pg-mem PostgreSQL engine
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      memDb.public.none(sql);
    }
  } catch (err) {
    console.warn('pg-mem schema initialization notice:', err);
  }
  
  return poolInstance;
}

export function getPool() {
  if (!activePool) {
    activePool = new PgPool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 1000,
    });

    activePool.on('error', (err: any) => {
      console.warn('PostgreSQL connection fallback notice:', err?.message || err);
    });
  }
  return activePool;
}

export const pool = {
  query: async (text: string, params?: any[]) => {
    try {
      const p = getPool();
      return await p.query(text, params);
    } catch (err: any) {
      if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
        if (!activePoolIsMem) {
          activePool = createInMemoryPgPool();
          activePoolIsMem = true;
        }
        return await activePool.query(text, params);
      }
      throw err;
    }
  },
  connect: async () => {
    try {
      const p = getPool();
      return await p.connect();
    } catch (err: any) {
      if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
        if (!activePoolIsMem) {
          activePool = createInMemoryPgPool();
          activePoolIsMem = true;
        }
        return await activePool.connect();
      }
      throw err;
    }
  },
  end: async () => {
    if (activePool && activePool.end) {
      await activePool.end();
    }
  }
};

let activePoolIsMem = false;

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}
