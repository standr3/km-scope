import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, listClassroomsAdminApi, createClassroomApi, updateClassroomApi, deleteClassroomApi, listClassroomStudentsApi, addStudentToClassroomApi, removeStudentFromClassroomApi } from '../api/admin';

export default function AdminClassrooms() {
  const qc = useQueryClient();
  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi });
  const roomsQ = useQuery({ queryKey:['classrooms'], queryFn: listClassroomsAdminApi });

  const createM = useMutation({ mutationFn: createClassroomApi, onSuccess: () => qc.invalidateQueries({ queryKey:['classrooms'] }) });
  const updateM = useMutation({ mutationFn: ({id,body}) => updateClassroomApi(id, body), onSuccess: () => qc.invalidateQueries({ queryKey:['classrooms'] }) });
  const deleteM = useMutation({ mutationFn: deleteClassroomApi, onSuccess: () => qc.invalidateQueries({ queryKey:['classrooms'] }) });

  const [sel, setSel] = useState(null);
  const studentsQ = useQuery({
    queryKey:['classroom-students', sel?.id],
    queryFn: () => listClassroomStudentsApi(sel.id),
    enabled: !!sel
  });

  const [form, setForm] = useState({ school_id:'', name:'' });
  const schools = ovQ.data?.schools || [];
  const studentsAll = (ovQ.data?.students || []).map(m => ({ id:m.user_id, email:m.email }));

  const [addEmail, setAddEmail] = useState('');

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Classrooms</h3>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Create</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={form.school_id} onChange={e=>setForm(f=>({...f,school_id:e.target.value}))}>
            <option value="">Select school</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <button disabled={!form.school_id || !form.name} onClick={()=>createM.mutate(form)}>Add</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <h4>List</h4>
          <ul style={{ display:'grid', gap:8 }}>
            {(roomsQ.data || []).map(r => (
              <li key={r.id} style={{ border:'1px solid #eee', padding:10, borderRadius:6 }}>
                <b>{r.name}</b> <small>({r.school_name})</small>
                <div style={{ display:'flex', gap:8, marginTop:6 }}>
                  <button onClick={()=>setSel(r)}>Open</button>
                  <button onClick={()=>{
                    const name = prompt('New name', r.name);
                    if (name != null) updateM.mutate({ id:r.id, body:{ name } });
                  }}>Rename</button>
                  <button onClick={()=>deleteM.mutate(r.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Members {sel ? `(${sel.name})` : ''}</h4>
          {!sel && <p>Select a classroom.</p>}
          {sel && (
            <>
              {studentsQ.isLoading && <p>Loading…</p>}
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <input placeholder="student email" value={addEmail} onChange={e=>setAddEmail(e.target.value)} />
                <button onClick={()=>{
                  const st = studentsAll.find(s => s.email.toLowerCase() === addEmail.toLowerCase());
                  if (!st) return alert('Student not found in school');
                  addStudentToClassroomApi(sel.id, { student_id: st.id }).then(()=>{
                    qc.invalidateQueries({ queryKey:['classroom-students', sel.id] });
                    setAddEmail('');
                  });
                }}>Add</button>
              </div>
              <ul style={{ display:'grid', gap:6 }}>
                {(studentsQ.data || []).map(u => (
                  <li key={u.id} style={{ display:'flex', justifyContent:'space-between', border:'1px solid #eee', padding:'6px 10px', borderRadius:6 }}>
                    <span>{u.email}{u.name ? ` (${u.name})` : ''}</span>
                    <button onClick={()=>{
                      removeStudentFromClassroomApi(sel.id, { student_id:u.id }).then(()=>{
                        qc.invalidateQueries({ queryKey:['classroom-students', sel.id] });
                      });
                    }}>Remove</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}