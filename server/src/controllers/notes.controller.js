import pool from '../db/pool.js';

export async function listNotes(req, res) {
  const { rows } = await pool.query(
    'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  return res.json({ success: true, notes: rows });
}

export async function getNote(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    'SELECT id, title, content, created_at, updated_at FROM notes WHERE id=$1 AND user_id=$2',
    [id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, note: rows[0] });
}

export async function createNote(req, res) {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ success: false, message: 'Missing title/content' });

  const { rows } = await pool.query(
    'INSERT INTO notes (user_id, title, content) VALUES ($1,$2,$3) RETURNING id, title, content, created_at, updated_at',
    [req.user.id, title, content]
  );
  return res.status(201).json({ success: true, note: rows[0] });
}

export async function updateNote(req, res) {
  const { id } = req.params;
  const { title, content } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE notes
     SET title=COALESCE($1,title),
         content=COALESCE($2,content),
         updated_at=now()
     WHERE id=$3 AND user_id=$4
     RETURNING id, title, content, created_at, updated_at`,
    [title ?? null, content ?? null, id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, note: rows[0] });
}

export async function deleteNote(req, res) {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [id, req.user.id]);
  if (!rowCount) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true });
}