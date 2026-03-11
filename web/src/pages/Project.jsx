import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import { getProjectApi, getProjectWithMembersApi } from '../api/project';
import { getProjectApi } from '../api/project';


export default function Project() {
  const { classId, projectId } = useParams(); // din ruta: :classId, :projectId

  const q = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectApi(projectId),
    retry: 0, // fail-fast
  });

  // const q1 = useQuery({
  //   queryKey: ['project', projectId],
  //   queryFn: () => getProjectWithMembersApi(projectId),
  //   retry: 0, // fail-fast
  // });

  // console.log("PROJECT simplu")

  if (q.isLoading) return <p style={{ padding: 24 }}>Loading…</p>;

  if (q.isError) {
    const status = q.error?.status || q.error?.response?.status;
    if (status === 404) return <p style={{ padding: 24 }}>Project not found.</p>;
    return <p style={{ padding: 24 }}>Error loading project.</p>;
  }

  const p = q.data;
  // clg("Project query: ", q1.data);
  return (
    <div style={{ maxWidth: 800, margin: '24px auto', display: 'grid', gap: 16 }}>
      <h2>Project: {p.name}</h2>
      <p>Project ID: {p.id}</p>
      <p>Class ID: {p.class_id ?? classId}</p>
      <p>Owner ID: {p.owner_id}</p>
      <p>Created at: {new Date(p.created_at).toLocaleString()}</p>
    </div>
  );
}
