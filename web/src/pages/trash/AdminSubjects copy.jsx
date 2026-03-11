import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, listProgramsApi, listSubjectsAdminApi, createSubjectApi, updateSubjectApi, deleteSubjectApi } from '../api/admin';
import { useSearchParams } from 'react-router-dom';

const sortKeys = ['program','name','weekly_hours','weight'];

export default function AdminSubjects() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();

  const program = sp.get('program') || '';
  const sort = sortKeys.includes(sp.get('sort')) ? sp.get('sort') : 'name';
  const dir = sp.get('dir') === 'desc' ? 'desc' : 'asc';
  const required = sp.get('required') === 'true';

  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi, retry:false });
  const programsQ = useQuery({ queryKey:['programs', { sort:'name', dir:'asc' }], queryFn: () => listProgramsApi({ sort:'name', dir:'asc' }) });
  const subjectsQ = useQuery({
    queryKey:['subjects', { program, required, sort, dir }],
    queryFn: () => listSubjectsAdminApi({ program: program || undefined, required, sort, dir }),
    keepPreviousData: true
  });

  const createM = useMutation({
    mutationFn: createSubjectApi,
    onSuccess: () => qc.invalidateQueries({ queryKey:['subjects'] })
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateSubjectApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey:['subjects'] })
  });
  const deleteM = useMutation({
    mutationFn: deleteSubjectApi,
    onSuccess: () => qc.invalidateQueries({ queryKey:['subjects'] })
  });

  const schools = ovQ.data?.schools || [];
  const programs = programsQ.data || [];

  const [form, setForm] = useState({ program_id:'', name:'', year:'', weekly_hours:'', weight:'', is_required:true });

  const setParam = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v === '' || v == null) n.delete(k); else n.set(k, v);
    setSp(n, { replace:true });
  };
  const toggleSort = (key) => {
    const nextDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    setParam('sort', key);
    setParam('dir', nextDir);
  };

  const view = useMemo(()=>({
    header: `Sorted by ${sort} ${dir.toUpperCase()}`,
    filters: { program, required }
  }), [sort, dir, program, required]);

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Subjects</h3>
      <small>{view.header}</small>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Filters</h4>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select value={program} onChange={e=>setParam('program', e.target.value)}>
            <option value="">All programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={required} onChange={e=>setParam('required', e.target.checked ? 'true' : '')}/>
            &nbsp;Required only
          </label>
          <span style={{ marginLeft:12 }}>Sort:</span>
          <button onClick={()=>toggleSort('program')}>Program</button>
          <button onClick={()=>toggleSort('name')}>Name</button>
          <button onClick={()=>toggleSort('weekly_hours')}>Weekly hours</button>
          <button onClick={()=>toggleSort('weight')}>Weight</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Add subject</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={form.program_id} onChange={e=>setForm(f=>({...f,program_id:e.target.value}))}>
            <option value="">Select program</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input placeholder="Year" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}/>
          <input placeholder="Weekly hours" type="number" value={form.weekly_hours} onChange={e=>setForm(f=>({...f,weekly_hours:e.target.value}))}/>
          <input placeholder="Weight" type="number" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))}/>
          <label>
            <input type="checkbox" checked={form.is_required} onChange={e=>setForm(f=>({...f,is_required:e.target.checked}))}/> Required
          </label>
          <button
            onClick={()=>{
              if (!form.program_id || !form.name) return;
              createM.mutate({
                program_id: form.program_id,
                name: form.name,
                year: form.year? Number(form.year): undefined,
                weekly_hours: form.weekly_hours? Number(form.weekly_hours): undefined,
                weight: form.weight? Number(form.weight): undefined,
                is_required: form.is_required
              });
            }}
            disabled={!form.program_id || !form.name}
          >Add</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        {subjectsQ.isLoading && <p>Loading…</p>}
        {subjectsQ.isError && <p>Error</p>}
        <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
              <th>Program</th>
              <th>Name</th>
              <th>Year</th>
              <th>Weekly hours</th>
              <th>Weight</th>
              <th>Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(subjectsQ.data || []).map(s => (
              <tr key={s.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{s.program_name}</td>
                <td>{s.name}</td>
                <td>{s.year}</td>
                <td>{s.weekly_hours}</td>
                <td>{s.weight}</td>
                <td>{s.is_required ? 'Yes' : 'No'}</td>
                <td style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{
                    const name = prompt('New name', s.name);
                    const year = prompt('Year', String(s.year ?? 0));
                    const wh = prompt('Weekly hours', String(s.weekly_hours ?? 1));
                    const wg = prompt('Weight', String(s.weight ?? 1));
                    const req = confirm('Required? OK=yes, Cancel=no'); // simplu
                    updateM.mutate({
                      id: s.id,
                      body: {
                        name: name ?? undefined,
                        year: year !== null ? Number(year) : undefined,
                        weekly_hours: wh !== null ? Number(wh) : undefined,
                        weight: wg !== null ? Number(wg) : undefined,
                        is_required: req
                      }
                    });
                  }}>Edit</button>
                  <button onClick={()=>deleteM.mutate(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!subjectsQ.data?.length && <tr><td colSpan="7"><i>No subjects</i></td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}