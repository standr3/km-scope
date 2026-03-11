import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogProgramsApi, catalogSubjectsApi } from '../api/catalog';
import { useSearchParams } from 'react-router-dom';

const sortKeys = ['program','name','weekly_hours','weight'];

export default function MemberSubjects() {
  const [sp, setSp] = useSearchParams();
  const program = sp.get('program') || '';
  const sort = sortKeys.includes(sp.get('sort')) ? sp.get('sort') : 'name';
  const dir = sp.get('dir') === 'desc' ? 'desc' : 'asc';
  const required = sp.get('required') === 'true';

  const programsQ = useQuery({
    queryKey:['catalog-programs', { sort:'name', dir:'asc' }],
    queryFn: () => catalogProgramsApi({ sort:'name', dir:'asc' })
  });

  const subjectsQ = useQuery({
    queryKey:['catalog-subjects', { program, required, sort, dir }],
    queryFn: () => catalogSubjectsApi({ program: program || undefined, required, sort, dir }),
    keepPreviousData: true
  });

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

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Subjects (read-only)</h3>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select value={program} onChange={e=>setParam('program', e.target.value)}>
            <option value="">All programs</option>
            {(programsQ.data || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              </tr>
            ))}
            {!subjectsQ.data?.length && <tr><td colSpan="6"><i>No subjects</i></td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}