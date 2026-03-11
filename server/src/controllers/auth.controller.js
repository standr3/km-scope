import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { issueAccess, setRefreshCookie, clearRefreshCookie } from '../utils/tokens.js';

const toUserDto = (row) => ({
  id: row.id, name: row.name, email: row.email, isVerified: row.is_verified, createdAt: row.created_at
});

async function fetchUserWithRolesAndPending(userId) {
  const base = await pool.query(`
    SELECT u.*,
           COALESCE(array_agg(m.user_role) FILTER (WHERE m.user_role IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN memberships m ON m.user_id=u.id
    WHERE u.id=$1
    GROUP BY u.id
  `, [userId]);
  const u = base.rows[0];
  if (!u) return null;

  const pending = await pool.query(`
    SELECT r.school_id, s.name AS school_name, r.user_role, r.accepted
    FROM member_req r
    JOIN schools s ON s.id=r.school_id
    WHERE r.user_id=$1
    ORDER BY r.accepted ASC, r.created_at ASC
  `, [userId]);

  return { user: toUserDto(u), roles: u.roles, pendingRequests: pending.rows };
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success:false, message:'Missing credentials' });
  const q = await pool.query('SELECT * FROM users WHERE lower(email)=lower($1)', [email]);
  const u = q.rows[0];
  if (!u) return res.status(400).json({ success:false, message:'Invalid credentials' });
  const ok = await bcryptjs.compare(password, u.password_hash);
  if (!ok) return res.status(400).json({ success:false, message:'Invalid credentials' });

  const full = await fetchUserWithRolesAndPending(u.id);
  const access = issueAccess(full.user, full.roles);
  setRefreshCookie(res, full.user.id);
  return res.json({ success:true, user: full.user, access_token: access, roles: full.roles });
}

export async function signup(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ success:false, message:'Missing fields' });
  const ex = await pool.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [email]);
  if (ex.rows[0]) return res.status(400).json({ success:false, message:'User exists' });
  const hash = await bcryptjs.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,true) RETURNING *',
    [name ?? null, email, hash]
  );
  const full = await fetchUserWithRolesAndPending(rows[0].id);
  const access = issueAccess(full.user, full.roles);
  setRefreshCookie(res, full.user.id);
  return res.status(201).json({ success:true, user: full.user, access_token: access, roles: full.roles });
}

export async function registerSchool(req, res) {
  const { school, admin } = req.body || {};
  if (!school?.name || !admin?.email || !admin?.password) {
    return res.status(400).json({ success:false, message:'Missing fields' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ex = await client.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [admin.email]);
    if (ex.rows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ success:false, message:'User exists' }); }

    const sch = await client.query(
      'INSERT INTO schools (name, addr, contact_email, contact_phone) VALUES ($1,$2,$3,$4) RETURNING *',
      [school.name, school.address ?? null, school.contact_email ?? null, school.contact_phone ?? null]
    );
    const hash = await bcryptjs.hash(admin.password, 10);
    const u = await client.query(
      'INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,true) RETURNING *',
      [null, admin.email, hash]
    );
    await client.query(
      'INSERT INTO memberships (school_id,user_id,user_role) VALUES ($1,$2,$3)',
      [sch.rows[0].id, u.rows[0].id, 'admin']
    );
    await client.query('COMMIT');

    const full = await fetchUserWithRolesAndPending(u.rows[0].id);
    const access = issueAccess(full.user, full.roles);
    setRefreshCookie(res, full.user.id);
    return res.status(201).json({ success:true, user: full.user, access_token: access, roles: full.roles, school: sch.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    client.release();
  }
}

export async function registerMember(req, res) {
  const { name, email, password, school_id, role } = req.body || {};
  if (!name || !email || !password || !school_id || !['teacher','student'].includes(role)) {
    return res.status(400).json({ success:false, message:'Missing fields' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sch = await client.query('SELECT id FROM schools WHERE id=$1', [school_id]);
    if (!sch.rows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ success:false, message:'School not found' }); }

    const ex = await client.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [email]);
    if (ex.rows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ success:false, message:'User exists' }); }

    const hash = await bcryptjs.hash(password, 10);
    const u = await client.query(
      'INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,true) RETURNING *',
      [name, email, hash]
    );

    await client.query(
      'INSERT INTO member_req (school_id,user_id,user_role,accepted) VALUES ($1,$2,$3,false) ON CONFLICT (school_id,user_id) DO UPDATE SET user_role=$3',
      [school_id, u.rows[0].id, role]
    );

    await client.query('COMMIT');

    const full = await fetchUserWithRolesAndPending(u.rows[0].id);
    const access = issueAccess(full.user, full.roles);
    setRefreshCookie(res, full.user.id);
    return res.status(201).json({ success:true, user: full.user, access_token: access, roles: full.roles });
  } catch (e) {
    await client.query('ROLLBACK').catch(()=>{});
    return res.status(500).json({ success:false, message:'Server error' });
  } finally {
    client.release();
  }
}

export async function refresh(req, res) {
  const origin = req.get('origin');
  if (origin && origin !== process.env.CLIENT_URL) return res.status(403).json({ success:false, message:'Forbidden' });
  const rt = req.cookies?.refresh_token;
  if (!rt) return res.status(401).json({ success:false, message:'Unauthorized' });
  try {
    const p = jwt.verify(rt, process.env.REAL_REFRESH_SECRET || process.env.REFRESH_SECRET, {
      algorithms: ['HS256'], issuer: 'your-api', clockTolerance: 5
    });
    const full = await fetchUserWithRolesAndPending(p.sub);
    if (!full) return res.status(401).json({ success:false, message:'Unauthorized' });
    setRefreshCookie(res, full.user.id);
    const access = issueAccess(full.user, full.roles);
    return res.json({ success:true, access_token: access });
  } catch {
    return res.status(401).json({ success:false, message:'Unauthorized' });
  }
}

export async function checkAuth(req, res) {
  const full = await fetchUserWithRolesAndPending(req.user.id);
  if (!full) return res.status(404).json({ success:false, message:'User not found' });
  return res.json({ success:true, user: full.user, roles: full.roles, pendingRequests: full.pendingRequests });
}

export async function logout(_req, res) {
  clearRefreshCookie(res);
  return res.json({ success:true });
}