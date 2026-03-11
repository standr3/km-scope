import pool from '../db/pool.js';

export async function adminSchoolIds(userId) {
  const { rows } = await pool.query(
    'SELECT school_id FROM memberships WHERE user_id=$1 AND user_role=$2',
    [userId, 'admin']
  );
  return rows.map(r => r.school_id);
}

export async function userSchoolIds(userId) {
  const { rows } = await pool.query(
    'SELECT school_id FROM memberships WHERE user_id=$1',
    [userId]
  );
  return rows.map(r => r.school_id);
}

export async function adminOverview(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, schools: [], teachers: [], students: [], requests_teachers: [], requests_students: [] });

  const schools = await pool.query('SELECT * FROM schools WHERE id = ANY($1::uuid[])', [ids]);

  const teachers = await pool.query(`
    SELECT m.id as membership_id, m.school_id, m.user_id, m.user_role,
           u.email, u.name
    FROM memberships m
    JOIN users u ON u.id=m.user_id
    WHERE m.school_id = ANY($1::uuid[]) AND m.user_role='teacher'
    ORDER BY u.email
  `, [ids]);

  const students = await pool.query(`
    SELECT m.id as membership_id, m.school_id, m.user_id, m.user_role,
           u.email, u.name
    FROM memberships m
    JOIN users u ON u.id=m.user_id
    WHERE m.school_id = ANY($1::uuid[]) AND m.user_role='student'
    ORDER BY u.email
  `, [ids]);

  const requests = await pool.query(`
    SELECT r.id as request_id, r.school_id, r.user_id, r.user_role, r.accepted,
           u.email, u.name
    FROM member_req r
    JOIN users u ON u.id=r.user_id
    WHERE r.school_id = ANY($1::uuid[])
    ORDER BY r.accepted ASC, r.created_at ASC
  `, [ids]);

  return res.json({
    success:true,
    schools: schools.rows,
    teachers: teachers.rows,
    students: students.rows,
    requests_teachers: requests.rows.filter(r => !r.accepted && r.user_role === 'teacher'),
    requests_students: requests.rows.filter(r => !r.accepted && r.user_role === 'student')
  });
}

export async function acceptRequest(req, res) {
  const { id } = req.params;
  const rq = await pool.query('SELECT * FROM member_req WHERE id=$1', [id]);
  const r = rq.rows[0];
  if (!r) return res.status(404).json({ success:false, message:'Request not found' });

  const adminSchools = await adminSchoolIds(req.user.id);
  if (!adminSchools.includes(r.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('UPDATE member_req SET accepted=true WHERE id=$1', [id]);
    await c.query(`
      INSERT INTO memberships (school_id,user_id,user_role)
      VALUES ($1,$2,$3)
      ON CONFLICT (school_id,user_id) DO UPDATE SET user_role=$3
    `, [r.school_id, r.user_id, r.user_role]);
    await c.query('COMMIT');
    return res.json({ success:true });
  } catch (e) {
    await c.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    c.release();
  }
}

export async function revokeMember(req, res) {
  const { membershipId } = req.params;
  const mq = await pool.query('SELECT * FROM memberships WHERE id=$1', [membershipId]);
  const m = mq.rows[0];
  if (!m) return res.status(404).json({ success:false, message:'Membership not found' });

  const adminSchools = await adminSchoolIds(req.user.id);
  if (!adminSchools.includes(m.school_id)) return res.status(403).json({ success:false, message:'Forbidden' });

  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM memberships WHERE id=$1', [membershipId]);
    await c.query('UPDATE member_req SET accepted=false WHERE school_id=$1 AND user_id=$2 AND user_role=$3', [m.school_id, m.user_id, m.user_role]);
    await c.query('COMMIT');
    return res.json({ success:true });
  } catch (e) {
    await c.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    c.release();
  }
}