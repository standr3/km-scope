import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, listProgramsApi, listSubjectsAdminApi, listClassroomsAdminApi, listPeriodsAdminApi, listClassesAdminApi, createClassAdminApi, deleteClassAdminApi } from '../api/admin';

export default function AdminClasses() {
  const qc = useQueryClient();
  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi });
  const programsQ = useQuery({ queryKey:['programs', { sort:'name', dir:'asc' }], queryFn: () => listProgramsApi({ sort:'name', dir:'asc' }) });
  const [programId, setProgramId] = useState('');
  const subjectsQ = useQuery({ queryKey:['subjects-admin', { program: programId }], queryFn: () => listSubjectsAdminApi({ program: programId || undefined, sort:'name', dir:'asc' }), enabled: !!programId });
  const classroomsQ = useQuery({ queryKey:['classrooms'], queryFn: listClassroomsAdminApi });
  const yearsQ = useQuery({ queryKey:['schoolYears'], queryFn: () => import('../api/admin').then(m=>m.listSchoolYearsAdminApi()) });
  const [yearId, setYearId] = useState('');
  const periodsQ = useQuery({ queryKey:['periods', { school_year_id: yearId }], queryFn: () => listPeriodsAdminApi({ school_year_id: yearId || undefined }), enabled: !!yearId });

  const classesQ = useQuery({ queryKey:['classes-admin'], queryFn: listClassesAdminApi });
  const createM = useMutation({ mutationFn: createClassAdminApi, onSuccess: () => qc.invalidateQueries({ queryKey:['classes-admin'] }) });
  const deleteM = useMutation({ mutationFn: deleteClassAdminApi, onSuccess: () => qc.invalidateQueries({ queryKey:['classes-admin'] }) });

  const teachers = (ovQ.data?.teachers || []).map(t => ({ id:t.user_id, email:t.email, school_id:t.school_id }));

  const [f, setF] = useState({ subject_id:'', teacher_id:'', name:'', classroom_id:'', start_period_id:'', end_period_id:'' });

  useEffect(()=>{ setF(s=>({ ...s, subject_id:'' })); }, [programId]);

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Classes</h3>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Create</h4>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={programId} onChange={e=>setProgramId(e.target.value)}>
              <option value="">Select program</option>
              {(programsQ.data || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={f.subject_id} onChange={e=>setF(s=>({...s,subject_id:e.target.value}))} disabled={!subjectsQ.data}>
              <option value="">Select subject</option>
              {(subjectsQ.data || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={f.teacher_id} onChange={e=>setF(s=>({...s,teacher_id:e.target.value}))}>
              <option value="">Select teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.email}</option>)}
            </select>
            <input placeholder="Class name" value={f.name} onChange={e=>setF(s=>({...s,name:e.target.value}))}/>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={f.classroom_id} onChange={e=>setF(s=>({...s,classroom_id:e.target.value}))}>
              <option value="">No classroom</option>
              {(classroomsQ.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={yearId} onChange={e=>setYearId(e.target.value)}>
              <option value="">Year for periods</option>
              {(yearsQ.data || []).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <select value={f.start_period_id} onChange={e=>setF(s=>({...s,start_period_id:e.target.value}))} disabled={!periodsQ.data}>
              <option value="">Start period</option>
              {(periodsQ.data || []).map(p => <option key={p.id} value={p.id}>{p.start_time}-{p.end_time}</option>)}
            </select>
            <select value={f.end_period_id} onChange={e=>setF(s=>({...s,end_period_id:e.target.value}))} disabled={!periodsQ.data}>
              <option value="">End period</option>
              {(periodsQ.data || []).map(p => <option key={p.id} value={p.id}>{p.start_time}-{p.end_time}</option>)}
            </select>
          </div>
          <div>
            <button
              disabled={!f.subject_id || !f.teacher_id || !f.name}
              onClick={()=>createM.mutate({
                subject_id: f.subject_id,
                teacher_id: f.teacher_id,
                name: f.name,
                classroom_id: f.classroom_id || undefined,
                start_period_id: f.start_period_id || undefined,
                end_period_id: f.end_period_id || undefined
              })}
            >Create class</button>
          </div>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>All classes</h4>
        {classesQ.isLoading && <p>Loading…</p>}
        <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse' }}>
          <thead><tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
            <th>Name</th><th>Subject</th><th>Teacher</th><th>Classroom</th><th>Periods</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {(classesQ.data || []).map(c => (
              <tr key={c.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{c.name}</td>
                <td>{c.subject_name} <small>({c.program_name})</small></td>
                <td>{c.teacher_email}</td>
                <td>{c.classroom_name || '-'}</td>
                <td>{c.start_period_id ? 'set' : '-'} / {c.end_period_id ? 'set' : '-'}</td>
                <td><button onClick={()=>deleteM.mutate(c.id)}>Delete</button></td>
              </tr>
            ))}
            {!classesQ.data?.length && <tr><td colSpan="6"><i>No classes</i></td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}