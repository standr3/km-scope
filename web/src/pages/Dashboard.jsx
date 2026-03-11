// TODO: check if this is used

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotesApi, createNoteApi, updateNoteApi, deleteNoteApi } from '../api/notes';

import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  console.log("dash")
  const { user, logout, loggingOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const notesQ = useQuery({
    queryKey: ['notes'],
    queryFn: listNotesApi,
    retry: (count, err) => count < 1 // fail-fast
  });

  const createM = useMutation({
    mutationFn: createNoteApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] })
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateNoteApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] })
  });
  const deleteM = useMutation({
    mutationFn: deleteNoteApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] })
  });

  const [newNote, setNewNote] = useState({ title: '', content: '' });

  if (!user) return <p style={{ padding: 24 }}>No user. <button onClick={() => nav('/')}>Go login</button></p>;

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>KMAP</span>
        <div>
          <span style={{ marginRight: 12 }}>{user.email}</span>
          <button onClick={() => logout().then(() => nav('/'))} disabled={loggingOut}>
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </header>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h3>Add note</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Title" value={newNote.title} onChange={e => setNewNote(n => ({ ...n, title: e.target.value }))} />
          <textarea placeholder="Content" value={newNote.content} onChange={e => setNewNote(n => ({ ...n, content: e.target.value }))} />
          <button onClick={() => createM.mutate(newNote)}>Add</button>
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h3>Your notes</h3>
        {notesQ.isLoading && <p>Loading…</p>}
        {notesQ.isError && <p>Error loading notes</p>}
        <ul style={{ display: 'grid', gap: 8 }}>
          {(notesQ.data || []).map(n => (
            <li key={n.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
              <b>{n.title}</b>
              <p>{n.content}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/note/${n.id}`}>Open</Link>
                <button onClick={() => {
                  const title = prompt('New title', n.title);
                  const content = prompt('New content', n.content);
                  if (title != null && content != null) updateM.mutate({ id: n.id, body: { title, content } });
                }}>Edit</button>
                <button onClick={() => deleteM.mutate(n.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
