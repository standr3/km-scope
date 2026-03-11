import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, listProgramsApi, createProgramApi, updateProgramApi, deleteProgramApi } from '../api/admin';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AdminPrograms() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const sort = sp.get('sort') || 'created';  // created | name
  const dir = sp.get('dir') || 'asc';        // asc | desc

  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi, retry:false });
  const programsQ = useQuery({
    queryKey:['programs', { sort, dir }],
    queryFn: () => listProgramsApi({ sort, dir }),
    keepPreviousData: true
  });

  const createM = useMutation({
    mutationFn: createProgramApi,
    onSuccess: () => qc.invalidateQueries({ queryKey:['programs'] })
  });
  const updateM = useMutation({
    mutationFn: ({ id, body }) => updateProgramApi(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey:['programs'] })
  });
  const deleteM = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => qc.invalidateQueries({ queryKey:['programs'] })
  });

  const schools = ovQ.data?.schools || [];
  const [form, setForm] = useState({ school_id:'', name:'', descr:'' });

  const onSort = (key) => {
    const nextDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    const n = new URLSearchParams(sp);
    n.set('sort', key);
    n.set('dir', nextDir);
    setSp(n, { replace:true });
  };

  const sortedHint = useMemo(()=>`Sorted by ${sort} ${dir.toUpperCase()}`, [sort, dir]);

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Programs</h3>
      <small>{sortedHint}</small>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Create program</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={form.school_id} onChange={e=>setForm(f=>({...f,school_id:e.target.value}))}>
            <option value="">Select school</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input placeholder="Description" value={form.descr} onChange={e=>setForm(f=>({...f,descr:e.target.value}))}/>
          <button
            onClick={()=> form.school_id && form.name && createM.mutate(form)}
            disabled={!form.school_id || !form.name}
          >Add program</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>onSort('name')}>Sort by name</button>
          <button onClick={()=>onSort('created')}>Sort by created</button>
        </div>
        {programsQ.isLoading && <p>Loading…</p>}
        {programsQ.isError && <p>Error</p>}
        <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse', marginTop:8 }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
              <th>Program</th><th>School</th><th>Description</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(programsQ.data || []).map(p => (
              <tr key={p.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{p.name}</td>
                <td>{p.school_name}</td>
                <td>{p.descr || '-'}</td>
                <td style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{
                    const name = prompt('New name', p.name);
                    const descr = prompt('New description', p.descr || '');
                    if (name != null || descr != null) updateM.mutate({ id:p.id, body:{ name, descr }});
                  }}>Edit</button>
                  <button onClick={()=>deleteM.mutate(p.id)}>Delete</button>
                  <button onClick={()=>{
                    const url = new URL(location.origin + '/dashboard/admin/subjects');
                    url.searchParams.set('program', p.id);
                    url.searchParams.set('sort', 'name');
                    url.searchParams.set('dir', 'asc');
                    nav(url.pathname + url.search);
                  }}>View subjects</button>
                </td>
              </tr>
            ))}
            {!programsQ.data?.length && (
              <tr><td colSpan="4"><i>No programs</i></td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}