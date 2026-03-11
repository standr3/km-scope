import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogProgramsApi } from '../api/catalog';
import { useSearchParams } from 'react-router-dom';

export default function MemberPrograms() {
  const [sp, setSp] = useSearchParams();
  const sort = sp.get('sort') || 'created';
  const dir = sp.get('dir') || 'asc';

  const programsQ = useQuery({
    queryKey:['catalog-programs', { sort, dir }],
    queryFn: () => catalogProgramsApi({ sort, dir }),
    keepPreviousData: true
  });

  const onSort = (key) => {
    const nextDir = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    const n = new URLSearchParams(sp);
    n.set('sort', key);
    n.set('dir', nextDir);
    setSp(n, { replace:true });
  };

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h3>Programs (read-only)</h3>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>onSort('name')}>Sort by name</button>
        <button onClick={()=>onSort('created')}>Sort by created</button>
      </div>
      {programsQ.isLoading && <p>Loading…</p>}
      {programsQ.isError && <p>Error</p>}
      <ul style={{ display:'grid', gap:8 }}>
        {(programsQ.data || []).map(p => (
          <li key={p.id} style={{ border:'1px solid #eee', padding:12, borderRadius:6 }}>
            <b>{p.name}</b> <small>({p.school_name})</small>
            <div>{p.descr || '-'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}