import pool from '../db/pool.js';
import { adminSchoolIds } from './admin.controller.js';

const sortMap = {
  program: 'lower(pg.name)',
  name: 'lower(sb.name)',
  weekly_hours: 'ps.weekly_hours',
  weight: 'ps.weight'
};

export async function listSubjects(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, subjects: [] });

  const { program, required, sort, dir } = req.query;
  const order = sortMap[sort] ? sortMap[sort] : 'sb.created_at';
  const direction = dir === 'desc' ? 'DESC' : 'ASC';

  const params = [ids];
  const where = ['pg.school_id = ANY($1::uuid[])'];

  if (program) { params.push(program); where.push(`sb.program_id = $${params.length}`); }
  if (required === 'true') { where.push('ps.is_required = true'); }

  const sql = `
    SELECT sb.id, sb.program_id, sb.name,
           ps.year, ps.is_required, ps.weekly_hours, ps.weight,
           pg.name AS program_name
    FROM subjects sb
    JOIN programs pg ON pg.id=sb.program_id
    LEFT JOIN program_subject ps ON ps.program_id=sb.program_id AND ps.subject_id=sb.id
    WHERE ${where.join(' AND ')}
    ORDER BY ${order} ${direction}, sb.id ASC
  `;
  const { rows } = await pool.query(sql, params);
  return res.json({ success:true, subjects: rows });
}

export async function createSubject(req, res) {
  const { program_id, name, year, is_required, weekly_hours, weight } = req.body || {};
  if (!program_id || !name) return res.status(400).json({ success:false, message:'Missing fields' });

  // check admin of program's school
  const pq = await pool.query('SELECT school_id FROM programs WHERE id=$1', [program_id]);
  const p = pq.rows[0];
  if (!p) return res.status(404).json({ success:false, message:'Program not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(p.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const sb = await c.query(
      'INSERT INTO subjects (program_id, name) VALUES ($1,$2) RETURNING id, program_id, name, created_at',
      [program_id, name]
    );
    await c.query(
      `INSERT INTO program_subject (program_id, subject_id, year, is_required, weekly_hours, weight)
       VALUES ($1,$2, COALESCE($3,0), COALESCE($4,true), COALESCE($5,1), COALESCE($6,1))`,
      [program_id, sb.rows[0].id, year ?? null, is_required ?? null, weekly_hours ?? null, weight ?? null]
    );
    await c.query('COMMIT');
    return res.status(201).json({ success:true, subject: sb.rows[0] });
  } catch (e) {
    await c.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    c.release();
  }
}

export async function updateSubject(req, res) {
  const { id } = req.params;
  // fetch program_id and school_id
  const f = await pool.query(`
    SELECT sb.program_id, pg.school_id
    FROM subjects sb JOIN programs pg ON pg.id=sb.program_id
    WHERE sb.id=$1
  `, [id]);
  const row = f.rows[0];
  if (!row) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(row.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { name, year, is_required, weekly_hours, weight } = req.body || {};
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    if (name !== undefined) {
      await c.query('UPDATE subjects SET name=$1 WHERE id=$2', [name, id]);
    }
    if (year !== undefined || is_required !== undefined || weekly_hours !== undefined || weight !== undefined) {
      await c.query(`
        UPDATE program_subject SET
          year = COALESCE($1, year),
          is_required = COALESCE($2, is_required),
          weekly_hours = COALESCE($3, weekly_hours),
          weight = COALESCE($4, weight)
        WHERE program_id=$5 AND subject_id=$6
      `, [year ?? null, is_required ?? null, weekly_hours ?? null, weight ?? null, row.program_id, id]);
    }
    await c.query('COMMIT');
    return res.json({ success:true });
  } catch (e) {
    await c.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    c.release();
  }
}

export async function deleteSubject(req, res) {
  const { id } = req.params;
  const f = await pool.query(`
    SELECT sb.program_id, pg.school_id
    FROM subjects sb JOIN programs pg ON pg.id=sb.program_id
    WHERE sb.id=$1
  `, [id]);
  const row = f.rows[0];
  if (!row) return res.status(404).json({ success:false, message:'Not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(row.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM subjects WHERE id=$1', [id]); // CASCADE -> program_subject
  return res.json({ success:true });
}