import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// listă scoli pentru dropdown teacher signup
router.get('/schools', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name FROM schools ORDER BY name ASC');
  return res.json({ success:true, schools: rows });
});

export default router;
