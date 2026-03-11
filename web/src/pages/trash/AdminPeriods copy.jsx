import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSchoolYearsAdminApi, listPeriodsAdminApi, createPeriodApi, updatePeriodApi, deletePeriodApi } from '../api/admin';
import { useSearchParams } from 'react-router-dom';

export default function AdminPeriods() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const school_year_id = sp.get('school_year_id') || '';

  const yearsQ = useQuery({ queryKey:['schoolYears'], queryFn: listSchoolYearsAdminApi });
  const periodsQ = useQuery({
    queryKey:['periods', { school_year_id }],
    queryFn: () => listPeriodsAdminApi({ school_year_id: school_year_id || undefined }),
    keepPreviousData: true
  });

  const createM = useMutation({ mutationFn: createPeriodApi, onSuccess: () => qc.invalidateQueries({ queryKey:['periods'] }) });
  const updateM = useMutation({ mutationFn: ({ id, body }) => updatePeriodApi(id, body), onSuccess: () => qc.invalidateQueries({ queryKey:['periods'] }) });
  const deleteM = useMutation({ mutationFn: deletePeriodApi, onSuccess: () => qc.invalidateQueries({ queryKey:['periods'] }) });

  const [f, setF] = useState({ school_year_id:'', start_time:'12:00', end_time:'13:20' });

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Periods</h3>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Filter</h4>
        <select value={school_year_id} onChange={e=>{
          const n = new URLSearchParams(sp);
          const v = e.target.value;
          if (v) n.set('school_year_id', v); else n.delete('school_year_id');
          setSp(n, { replace:true });
        }}>
          <option value="">All years</option>
          {(yearsQ.data || []).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Create</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={f.school_year_id} onChange={e=>setF(s=>({...s,school_year_id:e.target.value}))}>
            <option value="">Select year</option>
            {(yearsQ.data || []).map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <input type="time" value={f.start_time} onChange={e=>setF(s=>({...s,start_time:e.target.value}))}/>
          <input type="time" value={f.end_time} onChange={e=>setF(s=>({...s,end_time:e.target.value}))}/>
          <button disabled={!f.school_year_id} onClick={()=>createM.mutate(f)}>Add</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        {periodsQ.isLoading && <p>Loading…</p>}
        {periodsQ.isError && <p>Error</p>}
        <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
              <th>School year</th><th>Start</th><th>End</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(periodsQ.data || []).map(p => (
              <tr key={p.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{p.year_name}</td>
                <td>{p.start_time}</td>
                <td>{p.end_time}</td>
                <td style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{
                    const st = prompt('Start time (HH:MM)', p.start_time);
                    const et = prompt('End time (HH:MM)', p.end_time);
                    updateM.mutate({ id:p.id, body:{ start_time: st, end_time: et } });
                  }}>Edit</button>
                  <button onClick={()=>deleteM.mutate(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!periodsQ.data?.length && <tr><td colSpan="4"><i>No periods</i></td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}