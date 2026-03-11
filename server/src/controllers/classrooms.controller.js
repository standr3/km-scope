import pool from '../db/pool.js';
import { adminSchoolIds } from './admin.controller.js';

export async function listClassroomsAdmin(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, classrooms: [] });
  const { rows } = await pool.query(
    `SELECT c.*, s.name AS school_name
     FROM classrooms c JOIN schools s ON s.id=c.school_id
     WHERE c.school_id = ANY($1::uuid[])
     ORDER BY lower(c.name) ASC`, [ids]);
  return res.json({ success:true, classrooms: rows });
}

export async function createClassroom(req, res) {
  const { school_id, name } = req.body || {};
  if (!school_id || !name) return res.status(400).json({ success:false, message:'Missing fields' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(school_id)) return res.status(403).json({ success:false, message:'Forbidden' });
  const { rows } = await pool.query(
    `INSERT INTO classrooms (school_id,name) VALUES ($1,$2) RETURNING *`,
    [school_id, name]
  );
  return res.status(201).json({ success:true, classroom: rows[0] });
}

export async function updateClassroom(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM classrooms WHERE id=$1', [id]);
  const c = q.rows[0];
  if (!c) return res.status(404).json({ success:false, message:'Not found' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(c.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });
  const { name } = req.body || {};
  const { rows } = await pool.query('UPDATE classrooms SET name=COALESCE($1,name) WHERE id=$2 RETURNING *', [name ?? null, id]);
  return res.json({ success:true, classroom: rows[0] });
}

export async function deleteClassroom(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM classrooms WHERE id=$1', [id]);
  const c = q.rows[0];
  if (!c) return res.status(404).json({ success:false, message:'Not found' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(c.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });
  await pool.query('DELETE FROM classrooms WHERE id=$1', [id]); // cascades student_classroom; classes SET NULL
  return res.json({ success:true });
}

export async function listClassroomStudents(req, res) {
  const { id } = req.params;
  const q = await pool.query('SELECT school_id FROM classrooms WHERE id=$1', [id]);
  const c = q.rows[0];
  if (!c) return res.status(404).json({ success:false, message:'Not found' });
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(c.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name
     FROM student_classroom sc JOIN users u ON u.id=sc.student_id
     WHERE sc.classroom_id=$1
     ORDER BY lower(u.email) ASC`, [id]);
  return res.json({ success:true, students: rows });
}

export async function addStudentToClassroom(req, res) {
  const { id } = req.params; // classroom id
  const { student_id } = req.body || {};
  if (!student_id) return res.status(400).json({ success:false, message:'Missing student_id' });

  const cq = await pool.query('SELECT school_id FROM classrooms WHERE id=$1', [id]);
  const c = cq.rows[0];
  if (!c) return res.status(404).json({ success:false, message:'Classroom not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(c.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  // ensure student is member of same school as student
  const m = await pool.query('SELECT 1 FROM memberships WHERE user_id=$1 AND school_id=$2 AND user_role=$3', [student_id, c.school_id, 'student']);
  if (!m.rows[0]) return res.status(400).json({ success:false, message:'Student not in this school' });

  await pool.query(
    `INSERT INTO student_classroom (student_id, classroom_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`, [student_id, id]);
  return res.json({ success:true });
}

export async function removeStudentFromClassroom(req, res) {
  const { id } = req.params; // classroom id
  const { student_id } = req.body || {};
  if (!student_id) return res.status(400).json({ success:false, message:'Missing student_id' });

  const cq = await pool.query('SELECT school_id FROM classrooms WHERE id=$1', [id]);
  const c = cq.rows[0];
  if (!c) return res.status(404).json({ success:false, message:'Classroom not found' });

  const ids = await adminSchoolIds(req.user.id);
  if (!ids.includes(c.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM student_classroom WHERE classroom_id=$1 AND student_id=$2', [id, student_id]);
  return res.json({ success:true });
}