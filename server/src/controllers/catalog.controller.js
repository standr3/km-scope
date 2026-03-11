import pool from '../db/pool.js';
import { userSchoolIds } from './admin.controller.js';

const subjSortMap = {
  program: 'lower(pg.name)',
  name: 'lower(sb.name)',
  weekly_hours: 'ps.weekly_hours',
  weight: 'ps.weight'
};
const progSortMap = { created: 'p.created_at', name: 'lower(p.name)' };

export async function listProgramsPublic(req, res) {
  const ids = await userSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, programs: [] });

  const sort = req.query.sort === 'name' ? 'name' : 'created';
  const dir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await pool.query(
    `SELECT p.id, p.school_id, p.name, p.descr, p.created_at, s.name AS school_name
     FROM programs p
     JOIN schools s ON s.id=p.school_id
     WHERE p.school_id = ANY($1::uuid[])
     ORDER BY ${progSortMap[sort]} ${dir}, p.id ASC`,
    [ids]
  );
  return res.json({ success:true, programs: rows });
}

export async function listSubjectsPublic(req, res) {
  const ids = await userSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, subjects: [] });

  const { program, required, sort, dir } = req.query;
  const order = subjSortMap[sort] ? subjSortMap[sort] : 'sb.created_at';
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

export async function listSchoolYearsPublic(req, res) {
  const ids = await userSchoolIds(req.user.id);
  if (!ids.length) return res.json({ success:true, school_years: [] });

  const { rows } = await pool.query(
    `SELECT y.* , s.name AS school_name
     FROM school_years y
     JOIN schools s ON s.id=y.school_id
     WHERE y.school_id = ANY($1::uuid[])
     ORDER BY y.start_date DESC, y.name ASC`,
    [ids]
  );
  return res.json({ success:true, school_years: rows });
}

export async function listPeriodsPublic(req, res) {
  const ids = await userSchoolIds(req.user.id);
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