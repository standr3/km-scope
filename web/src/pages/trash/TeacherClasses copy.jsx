import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTeacherClassesApi } from '../api/teacher';
import { Link } from 'react-router-dom';

export default function TeacherClasses() {
  const q = useQuery({ queryKey:['teacher-classes'], queryFn: listTeacherClassesApi });
  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Your classes</h3>
      {q.isLoading && <p>Loading…</p>}
      <ul style={{ display:'grid', gap:8 }}>
        {(q.data || []).map(c => (
          <li key={c.id} style={{ border:'1px solid #eee', padding:10, borderRadius:6 }}>
            <b>{c.name}</b> — {c.subject_name} <small>({c.program_name})</small>
            <div style={{ marginTop:6 }}>
              <Link to={`/dashboard/teacher/classes/${c.id}/projects`}>View projects</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}