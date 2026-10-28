import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const url = process.env.DATABASE_URL || '';
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
// Hosted Postgres (Neon, Supabase, Render...) requires SSL. Strip sslmode from the URL so our ssl option is used.
const connectionString = url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: process.env.VERCEL ? 3 : 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});
pool.on('error', (err) => console.error('Unexpected PostgreSQL pool error:', err.message));
