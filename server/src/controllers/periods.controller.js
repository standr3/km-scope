import pool from '../db/pool.js';
import { adminSchoolIds } from './admin.controller.js';

export async function listPeriodsAdmin(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, periods: [] });
  const { school_year_id } = req.query;
  const params = [ids];
  let where = 'y.school_id = ANY($1::uuid[])';
  if (school_year_id) { params.push(school_year_id); where += ` AND p.school_year_id = $${params.length}`; }

  const { rows } = await pool.query(
    `SELECT p.*, y.name AS year_name, y.school_id
     FROM periods p
     JOIN school_years y ON y.id=p.school_year_id
     WHERE ${where}
     ORDER BY p.start_time ASC`,
    params
  );
  return res.json({ success:true, periods: rows });
}

export async function createPeriod(req, res) {
  const { school_year_id, start_time, end_time } = req.body || {};
  if (!school_year_id || !start_time || !end_time) return res.status(400).json({ success:false, message:'Missing fields' });
  const yq = await pool.query('SELECT school_id FROM school_years WHERE id=$1', [school_year_id]);
  const y = yq.rows[0];
  if (!y) return res.status(404).json({ success:false, message:'School year not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(y.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { rows } = await pool.query(
    `INSERT INTO periods (school_year_id,start_time,end_time)
     VALUES ($1,$2,$3) RETURNING *`,
    [school_year_id, start_time, end_time]
  );
  return res.status(201).json({ success:true, period: rows[0] });
}

export async function updatePeriod(req, res) {
  const { id } = req.params;
  const q = await pool.query(
    `SELECT p.id, y.school_id
     FROM periods p JOIN school_years y ON y.id=p.school_year_id
     WHERE p.id=$1`,
    [id]
  );
  const p = q.rows[0];
  if (!p) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(p.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { start_time, end_time } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE periods SET
       start_time=COALESCE($1,start_time),
       end_time=COALESCE($2,end_time)
     WHERE id=$3
     RETURNING *`,
    [start_time ?? null, end_time ?? null, id]
  );
  return res.json({ success:true, period: rows[0] });
}

export async function deletePeriod(req, res) {
  const { id } = req.params;
  const q = await pool.query(
    `SELECT p.id, y.school_id
     FROM periods p JOIN school_years y ON y.id=p.school_year_id
     WHERE p.id=$1`,
    [id]
  );
  const p = q.rows[0];
  if (!p) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(p.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM periods WHERE id=$1', [id]);
  return res.json({ success:true });
}