import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNoteApi, updateNoteApi } from '../api/notes';

export default function NotePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const noteQ = useQuery({ queryKey:['note', id], queryFn: () => getNoteApi(id), retry:false });
  const updateM = useMutation({
    mutationFn: ({ title, content }) => updateNoteApi(id, { title, content }),
    onSuccess: () => qc.invalidateQueries({ queryKey:['note', id] })
  });

  if (noteQ.isLoading) return <p>Loading…</p>;
  if (noteQ.isError) return <p>Not found</p>;

  const n = noteQ.data;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', display:'grid', gap:12 }}>
      <button onClick={() => nav('/dashboard/notes')}>⬅ Back to notes</button>
      <h2>{n.title}</h2>
      <pre style={{ whiteSpace:'pre-wrap' }}>{n.content}</pre>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => {
          const t = prompt('New title', n.title);
          if (t != null) updateM.mutate({ title: t, content: n.content });
        }}>Edit title</button>
        <button onClick={() => {
          const c = prompt('New content', n.content);
          if (c != null) updateM.mutate({ title: n.title, content: c });
        }}>Edit content</button>
      </div>
    </div>
  );
}
