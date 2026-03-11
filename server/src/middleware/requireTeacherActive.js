import pool from '../db/pool.js';

// Permite doar userilor cu membership activ ca 'teacher'
export async function requireTeacherActive(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM memberships WHERE user_id=$1 AND user_role=$2 LIMIT 1',
      [req.user.id, 'teacher']
    );
    if (!rows[0]) return res.status(403).json({ success:false, message:'TeacherMembershipRequired' });
    next();
  } catch {
    return res.status(500).json({ success:false, message:'Server error' });
  }
}
