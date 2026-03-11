import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotesApi, createNoteApi, updateNoteApi, deleteNoteApi } from '../api/notes';
import { Link } from 'react-router-dom';

export default function MemberNotes() {
  const qc = useQueryClient();
  const notesQ = useQuery({ queryKey:['notes'], queryFn: listNotesApi, retry:false });
  const createM = useMutation({ mutationFn: createNoteApi, onSuccess: () => qc.invalidateQueries({ queryKey:['notes'] }) });
  const updateM = useMutation({ mutationFn: ({id, body}) => updateNoteApi(id, body), onSuccess: () => qc.invalidateQueries({ queryKey:['notes'] }) });
  const deleteM = useMutation({ mutationFn: deleteNoteApi, onSuccess: () => qc.invalidateQueries({ queryKey:['notes'] }) });

  const [f, setF] = useState({ title:'', content:'' });

  return (
    <div style={{ display:'grid', gap:16 }}>
      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h3>Add note</h3>
        <input placeholder="Title" value={f.title} onChange={e=>setF(s=>({...s,title:e.target.value}))}/>
        <textarea placeholder="Content" value={f.content} onChange={e=>setF(s=>({...s,content:e.target.value}))}/>
        <button onClick={() => createM.mutate(f)}>Add</button>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h3>Your notes</h3>
        {notesQ.isLoading && <p>Loading…</p>}
        {notesQ.isError && <p>Error</p>}
        <ul style={{ display:'grid', gap:8 }}>
          {(notesQ.data || []).map(n => (
            <li key={n.id} style={{ border:'1px solid #eee', padding:12, borderRadius:6 }}>
              <b>{n.title}</b>
              <p>{n.content}</p>
              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/note/${n.id}`}>Open</Link>
                <button onClick={() => {
                  const title = prompt('New title', n.title);
                  const content = prompt('New content', n.content);
                  if (title != null && content != null) updateM.mutate({ id:n.id, body:{ title, content } });
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