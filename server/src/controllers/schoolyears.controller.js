import pool from '../db/pool.js';
import { adminSchoolIds } from './admin.controller.js';

export async function listSchoolYearsAdmin(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, school_years: [] });
  const { rows } = await pool.query(
    `SELECT y.*, s.name AS school_name
     FROM school_years y JOIN schools s ON s.id=y.school_id
     WHERE y.school_id = ANY($1::uuid[])
     ORDER BY y.start_date DESC, y.name ASC`,
    [ids]
  );
  return res.json({ success:true, school_years: rows });
}

export async function createSchoolYear(req, res) {
  const { school_id, name, start_date, end_date } = req.body || {};
  if (!school_id || !name || !start_date || !end_date) return res.status(400).json({ success:false, message:'Missing fields' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(school_id)) return res.status(403).json({ success:false, message:'Forbidden' });
  const { rows } = await pool.query(
    `INSERT INTO school_years (school_id,name,start_date,end_date)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [school_id, name, start_date, end_date]
  );
  return res.status(201).json({ success:true, school_year: rows[0] });
}

export async function updateSchoolYear(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM school_years WHERE id=$1', [id]);
  const y = q.rows[0];
  if (!y) return res.status(404).json({ success:false, message:'Not found' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(y.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { name, start_date, end_date } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE school_years SET
       name=COALESCE($1,name),
       start_date=COALESCE($2,start_date),
       end_date=COALESCE($3,end_date)
     WHERE id=$4
     RETURNING *`,
    [name ?? null, start_date ?? null, end_date ?? null, id]
  );
  return res.json({ success:true, school_year: rows[0] });
}

export async function deleteSchoolYear(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM school_years WHERE id=$1', [id]);
  const y = q.rows[0];
  if (!y) return res.status(404).json({ success:false, message:'Not found' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(y.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM school_years WHERE id=$1', [id]); // cascade -> periods
  return res.json({ success:true });
}