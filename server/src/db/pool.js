import 'dotenv/config';
import { Pool } from 'pg';

// Neon URL + ssl=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true }
});

export default pool;
