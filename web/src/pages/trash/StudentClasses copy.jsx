import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listStudentClassesApi, listStudentProjectsApi } from '../api/student';

export default function StudentClasses() {
  const classesQ = useQuery({ queryKey:['student-classes'], queryFn: listStudentClassesApi });

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>My classes</h3>
      {classesQ.isLoading && <p>Loading…</p>}
      <ul style={{ display:'grid', gap:10 }}>
        {(classesQ.data || []).map(c => (
          <ClassItem key={c.id} c={c} />
        ))}
      </ul>
    </div>
  );
}

function ClassItem({ c }) {
  const projQ = useQuery({ queryKey:['student-projects', c.id], queryFn: () => listStudentProjectsApi(c.id) });

  return (
    <li style={{ border:'1px solid #eee', padding:10, borderRadius:6 }}>
      <b>{c.name}</b> — {c.subject_name} <small>({c.program_name})</small>
      <div>Classroom: {c.classroom_name || '-'}</div>
      <div style={{ marginTop:6 }}>
        <b>Projects</b>
        {projQ.isLoading && <p>Loading…</p>}
        <ul>
          {(projQ.data || []).map(p => (
            <li key={p.id}>
              <Link to={`/dashboard/student/classes/${c.id}/projects/${p.id}`}>{p.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
