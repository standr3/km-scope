import pool from '../db/pool.js';
import { adminSchoolIds } from './admin.controller.js';

const sortMap = {
  created: 'p.created_at',
  name: 'lower(p.name)'
};

export async function listPrograms(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, programs: [] });

  const sort = req.query.sort === 'name' ? 'name' : 'created';
  const dir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await pool.query(
    `SELECT p.id, p.school_id, p.name, p.descr, p.created_at, s.name AS school_name
     FROM programs p
     JOIN schools s ON s.id=p.school_id
     WHERE p.school_id = ANY($1::uuid[])
     ORDER BY ${sortMap[sort]} ${dir}, p.id ASC`,
    [ids]
  );
  return res.json({ success:true, programs: rows });
}

export async function createProgram(req, res) {
  const { school_id, name, descr } = req.body || {};
  if (!school_id || !name) return res.status(400).json({ success:false, message:'Missing fields' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { rows } = await pool.query(
    'INSERT INTO programs (school_id,name,descr) VALUES ($1,$2,$3) RETURNING id, school_id, name, descr, created_at',
    [school_id, name, descr ?? null]
  );
  return res.status(201).json({ success:true, program: rows[0] });
}

export async function updateProgram(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM programs WHERE id=$1', [id]);
  const p = q.rows[0];
  if (!p) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(p.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { name, descr } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE programs SET
       name = COALESCE($1, name),
       descr = COALESCE($2, descr)
     WHERE id=$3
     RETURNING id, school_id, name, descr, created_at`,
    [name ?? null, descr ?? null, id]
  );
  return res.json({ success:true, program: rows[0] });
}

export async function deleteProgram(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM programs WHERE id=$1', [id]);
  const p = q.rows[0];
  if (!p) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(p.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM programs WHERE id=$1', [id]); // CASCADE -> subjects + program_subject
  return res.json({ success:true });
}