import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, acceptRequestApi, revokeMemberApi } from '../api/admin';

export default function AdminStudents() {
  const qc = useQueryClient();
  const ovQ = useQuery({ queryKey:['adminOverview'], queryFn: adminOverviewApi, retry:false });

  const acceptM = useMutation({ mutationFn: acceptRequestApi, onSuccess: () => qc.invalidateQueries({ queryKey:['adminOverview'] }) });
  const revokeM = useMutation({ mutationFn: revokeMemberApi, onSuccess: () => qc.invalidateQueries({ queryKey:['adminOverview'] }) });

  if (ovQ.isLoading) return <p>Loading…</p>;
  if (ovQ.isError) return <p>Error</p>;

  const { schools, students, requests_students } = ovQ.data;

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Schools</h3>
      <ul>{schools.map(s => <li key={s.id}><b>{s.name}</b></li>)}</ul>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h3>Pending student requests</h3>
        <ul>
          {requests_students.map(r => (
            <li key={r.request_id} style={{ display:'flex', gap:8 }}>
              <span>{r.email} → school {r.school_id}</span>
              <button onClick={() => acceptM.mutate(r.request_id)}>Accept</button>
            </li>
          ))}
          {!requests_students.length && <i>No pending</i>}
        </ul>
      </section>

      <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
        <h3>Students</h3>
        <ul>
          {students.map(m => (
            <li key={m.membership_id} style={{ display:'flex', gap:8 }}>
              <span>{m.email} (school {m.school_id})</span>
              <button onClick={() => revokeM.mutate(m.membership_id)}>Revoke</button>
            </li>
          ))}
          {!students.length && <i>No students</i>}
        </ul>
      </section>
    </div>
  );
}
