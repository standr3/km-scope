import pool from '../db/pool.js';

// Permite doar userilor cu membership activ ca 'teacher' sau 'student'
export async function requireMemberActive(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT 1 FROM memberships WHERE user_id=$1 AND user_role IN ('teacher','student') LIMIT 1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(403).json({ success:false, message:'MemberActiveRequired' });
    next();
  } catch {
    console.log("requireMemberActive - error")
    return res.status(500).json({ success:false, message:'Server error' });
  }
}
