// pages/ProjectPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getProjectApi,getProjectWithMembersApi } from '../api/project';
import ProjectShell from '../components/ProjectShell';
import OwnerProjectView from '../components/OwnerProjectView.jsx';
import GuestProjectView from '../components/GuestProjectView.jsx';

export default function ProjectPage() {
  // console.log("projectpage")
  const { projectId } = useParams();
  const { user } = useAuth();

  // const q = useQuery({
  //   queryKey: ['project', projectId],
  //   queryFn: () => getProjectApi(projectId),
  //   retry: 0,
  // });


  // console.log("project page")
  const q = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectWithMembersApi(projectId),
    retry: 0, // fail-fast
  });

  // console.log("Project query: ", q1?.data?.members);


  if (q.isLoading) return <ProjectShell><p style={{ padding:24 }}>Loading…</p></ProjectShell>;
  if (q.isError)   return <ProjectShell><p style={{ padding:24 }}>Error loading project.</p></ProjectShell>;

  const p = q.data;
  // console.log(p)
  const isOwner = user?.id && p.owner_id === user.id;

  return (
    <ProjectShell>
      {isOwner ? <OwnerProjectView project={p} /> : <GuestProjectView project={p} />}
    </ProjectShell>
  );
}
