import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, listSchoolYearsAdminApi, createSchoolYearApi, updateSchoolYearApi, deleteSchoolYearApi } from '../api/admin';

export default function AdminSchoolYears() {
  const qc = useQueryClient();
  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi });
  const yearsQ = useQuery({ queryKey:['schoolYears'], queryFn: listSchoolYearsAdminApi });

  const createM = useMutation({ mutationFn: createSchoolYearApi, onSuccess: () => qc.invalidateQueries({ queryKey:['schoolYears'] }) });
  const updateM = useMutation({ mutationFn: ({ id, body }) => updateSchoolYearApi(id, body), onSuccess: () => qc.invalidateQueries({ queryKey:['schoolYears'] }) });
  const deleteM = useMutation({ mutationFn: deleteSchoolYearApi, onSuccess: () => qc.invalidateQueries({ queryKey:['schoolYears'] }) });

  const schools = ovQ.data?.schools || [];
  const [f, setF] = useState({ school_id:'', name:'', start_date:'', end_date:'' });

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>School Years</h3>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h4>Create</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={f.school_id} onChange={e=>setF(s=>({...s,school_id:e.target.value}))}>
            <option value="">Select school</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Name (e.g. 2024-2025)" value={f.name} onChange={e=>setF(s=>({...s,name:e.target.value}))}/>
          <input type="date" value={f.start_date} onChange={e=>setF(s=>({...s,start_date:e.target.value}))}/>
          <input type="date" value={f.end_date} onChange={e=>setF(s=>({...s,end_date:e.target.value}))}/>
          <button disabled={!f.school_id || !f.name || !f.start_date || !f.end_date}
                  onClick={()=>createM.mutate(f)}>Add</button>
        </div>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        {yearsQ.isLoading && <p>Loading…</p>}
        {yearsQ.isError && <p>Error</p>}
        <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
              <th>School</th><th>Name</th><th>Start</th><th>End</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(yearsQ.data || []).map(y => (
              <tr key={y.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
                <td>{y.school_name}</td>
                <td>{y.name}</td>
                <td>{y.start_date}</td>
                <td>{y.end_date}</td>
                <td style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{
                    const name = prompt('New name', y.name);
                    const sd = prompt('Start date (YYYY-MM-DD)', y.start_date);
                    const ed = prompt('End date (YYYY-MM-DD)', y.end_date);
                    updateM.mutate({ id:y.id, body:{ name, start_date: sd, end_date: ed } });
                  }}>Edit</button>
                  <button onClick={()=>deleteM.mutate(y.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!yearsQ.data?.length && <tr><td colSpan="5"><i>No school years</i></td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}