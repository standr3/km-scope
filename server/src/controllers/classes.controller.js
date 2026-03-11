import pool from '../db/pool.js';
import { adminSchoolIds, userSchoolIds } from './admin.controller.js';

function rowsToDto(rows) {
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    subject_id: r.subject_id,
    subject_name: r.subject_name,
    program_name: r.program_name,
    school_id: r.school_id,
    school_name: r.school_name,
    teacher_id: r.teacher_id,
    teacher_email: r.teacher_email,
    classroom_id: r.classroom_id,
    classroom_name: r.classroom_name,
    start_period_id: r.start_period_id,
    end_period_id: r.end_period_id
  }));
}

export async function listClassesAdmin(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, classes: [] });
  const { rows } = await pool.query(
`SELECT c.*,
        sb.name AS subject_name,
        pg.name AS program_name,
        s.name AS school_name, pg.school_id,
        t.email AS teacher_email,
        cr.name AS classroom_name
 FROM classes c
 JOIN subjects sb ON sb.id=c.subject_id
 JOIN programs pg ON pg.id=sb.program_id
 JOIN schools s ON s.id=pg.school_id
 JOIN users t ON t.id=c.teacher_id
 LEFT JOIN classrooms cr ON cr.id=c.classroom_id
 WHERE pg.school_id = ANY($1::uuid[])
 ORDER BY lower(c.name) ASC`, [ids]);
  return res.json({ success:true, classes: rowsToDto(rows) });
}

export async function createClass(req, res) {
  const { subject_id, teacher_id, name, start_period_id, end_period_id, classroom_id } = req.body || {};
  if (!subject_id || !teacher_id || !name) return res.status(400).json({ success:false, message:'Missing fields' });

  // fetch related school ids
  const sb = await pool.query(`SELECT sb.id, pg.school_id FROM subjects sb JOIN programs pg ON pg.id=sb.program_id WHERE sb.id=$1`, [subject_id]);
  const sbr = sb.rows[0];
  if (!sbr) return res.status(404).json({ success:false, message:'Subject not found' });

  const adminIds = await adminSchoolIds(req.user.id);
  if (!adminIds.includes(sbr.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const tmem = await pool.query('SELECT 1 FROM memberships WHERE user_id=$1 AND school_id=$2 AND user_role IN (\'teacher\',\'admin\')', [teacher_id, sbr.school_id]);
  if (!tmem.rows[0]) return res.status(400).json({ success:false, message:'Teacher not in this school' });

  if (classroom_id) {
    const cr = await pool.query('SELECT 1 FROM classrooms WHERE id=$1 AND school_id=$2', [classroom_id, sbr.school_id]);
    if (!cr.rows[0]) return res.status(400).json({ success:false, message:'Classroom not in this school' });
  }
  if (start_period_id) {
    const sp = await pool.query(`SELECT 1 FROM periods p JOIN school_years y ON y.id=p.school_year_id WHERE p.id=$1 AND y.school_id=$2`, [start_period_id, sbr.school_id]);
    if (!sp.rows[0]) return res.status(400).json({ success:false, message:'Start period invalid' });
  }
  if (end_period_id) {
    const ep = await pool.query(`SELECT 1 FROM periods p JOIN school_years y ON y.id=p.school_year_id WHERE p.id=$1 AND y.school_id=$2`, [end_period_id, sbr.school_id]);
    if (!ep.rows[0]) return res.status(400).json({ success:false, message:'End period invalid' });
  }

  const c = await pool.query(
    `INSERT INTO classes (subject_id, teacher_id, name, start_period_id, end_period_id, classroom_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [subject_id, teacher_id, name, start_period_id ?? null, end_period_id ?? null, classroom_id ?? null]
  );

  // bulk enroll if classroom selected
  if (classroom_id) {
    await pool.query(
      `INSERT INTO stud_classes (student_id, class_id)
       SELECT sc.student_id, $1
       FROM student_classroom sc
       WHERE sc.classroom_id=$2
       ON CONFLICT DO NOTHING`,
      [c.rows[0].id, classroom_id]
    );
  }

  return res.status(201).json({ success:true, class: c.rows[0] });
}

export async function updateClass(req, res) {
  const { id } = req.params;
  const q = await pool.query(
`SELECT c.id, pg.school_id
 FROM classes c
 JOIN subjects sb ON sb.id=c.subject_id
 JOIN programs pg ON pg.id=sb.program_id
 WHERE c.id=$1`, [id]);
  const cl = q.rows[0];
  if (!cl) return res.status(404).json({ success:false, message:'Not found' });
  const adminIds = await adminSchoolIds(req.user.id);
  if (!adminIds.includes(cl.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const { name, start_period_id, end_period_id, classroom_id } = req.body || {};
  if (start_period_id) {
    const ok = await pool.query(`SELECT 1 FROM periods p JOIN school_years y ON y.id=p.school_year_id WHERE p.id=$1 AND y.school_id=$2`, [start_period_id, cl.school_id]);
    if (!ok.rows[0]) return res.status(400).json({ success:false, message:'Start period invalid' });
  }
  if (end_period_id) {
    const ok = await pool.query(`SELECT 1 FROM periods p JOIN school_years y ON y.id=p.school_year_id WHERE p.id=$1 AND y.school_id=$2`, [end_period_id, cl.school_id]);
    if (!ok.rows[0]) return res.status(400).json({ success:false, message:'End period invalid' });
  }
  if (classroom_id) {
    const ok = await pool.query('SELECT 1 FROM classrooms WHERE id=$1 AND school_id=$2', [classroom_id, cl.school_id]);
    if (!ok.rows[0]) return res.status(400).json({ success:false, message:'Classroom invalid' });
  }

  const { rows } = await pool.query(
    `UPDATE classes SET
       name = COALESCE($1,name),
       start_period_id = COALESCE($2,start_period_id),
       end_period_id = COALESCE($3,end_period_id),
       classroom_id = COALESCE($4,classroom_id)
     WHERE id=$5 RETURNING *`,
    [name ?? null, start_period_id ?? null, end_period_id ?? null, classroom_id ?? null, id]
  );
  return res.json({ success:true, class: rows[0] });
}

export async function deleteClass(req, res) {
  const { id } = req.params;
  const q = await pool.query(
`SELECT pg.school_id
 FROM classes c
 JOIN subjects sb ON sb.id=c.subject_id
 JOIN programs pg ON pg.id=sb.program_id
 WHERE c.id=$1`, [id]);
  const cl = q.rows[0];
  if (!cl) return res.status(404).json({ success:false, message:'Not found' });
  const adminIds = await adminSchoolIds(req.user.id);
  if (!adminIds.includes(cl.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  await pool.query('DELETE FROM classes WHERE id=$1', [id]); // cascades stud_classes and projects->branches
  return res.json({ success:true });
}

export async function listTeacherClasses(req, res) {
  const { rows } = await pool.query(
`SELECT c.*,
        sb.name AS subject_name,
        pg.name AS program_name,
        s.name AS school_name, pg.school_id,
        t.email AS teacher_email,
        cr.name AS classroom_name
 FROM classes c
 JOIN subjects sb ON sb.id=c.subject_id
 JOIN programs pg ON pg.id=sb.program_id
 JOIN schools s ON s.id=pg.school_id
 JOIN users t ON t.id=c.teacher_id
 LEFT JOIN classrooms cr ON cr.id=c.classroom_id
 WHERE c.teacher_id=$1
 ORDER BY lower(c.name) ASC`, [req.user.id]);
  return res.json({ success:true, classes: rowsToDto(rows) });
}

export async function listStudentClasses(req, res) {
  const { rows } = await pool.query(
`SELECT c.*,
        sb.name AS subject_name,
        pg.name AS program_name,
        s.name AS school_name, pg.school_id,
        t.email AS teacher_email,
        cr.name AS classroom_name
 FROM stud_classes sc
 JOIN classes c ON c.id=sc.class_id
 JOIN subjects sb ON sb.id=c.subject_id
 JOIN programs pg ON pg.id=sb.program_id
 JOIN schools s ON s.id=pg.school_id
 JOIN users t ON t.id=c.teacher_id
 LEFT JOIN classrooms cr ON cr.id=c.classroom_id
 WHERE sc.student_id=$1
 ORDER BY lower(c.name) ASC`, [req.user.id]);
  return res.json({ success:true, classes: rowsToDto(rows) });
}