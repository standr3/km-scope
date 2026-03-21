// pages/ProjectPage.jsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getProjectWithMembersApi } from '../api/project';
import ProjectShell from '../components/ProjectShell';
import ProjectView from '../components/ProjectView.jsx';
import { ReactFlowProvider } from '@xyflow/react';
import { ProjectUsersProvider } from '../context/ProjectUsersContext';

function ProjectPageContent({ project, currentUserId }) {
  const membersById = useMemo(() => {
    const map = new Map();

    for (const member of project.members) {
      map.set(member.id, {
        id: member.id,
        name: member.name,
        role: member.role,
      });
    }

    return map;
  }, [project.members]);

  const projectUsersValue = useMemo(() => {
    return {
      membersById,
      getMemberById: (userId) => membersById.get(userId),
      projectOwnerId: project.owner_id, 
    };
  }, [membersById]);

  const isOwner = project.owner_id === currentUserId;

  return (
    <ProjectShell>
      <ReactFlowProvider>
        <ProjectUsersProvider value={projectUsersValue}>
          <ProjectView
            project={project}
            projectRole={isOwner ? 'OWNER' : 'GUEST'}
          />
        </ProjectUsersProvider>
      </ReactFlowProvider>
    </ProjectShell>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectWithMembersApi(projectId),
    retry: 0,
  });

  if (q.isLoading) {
    return (
      <ProjectShell>
        <p style={{ padding: 24 }}>Loading…</p>
      </ProjectShell>
    );
  }

  if (q.isError || !q.data) {
    return (
      <ProjectShell>
        <p style={{ padding: 24 }}>Error loading project.</p>
      </ProjectShell>
    );
  }

  return (
    <ProjectPageContent
      project={q.data}
      currentUserId={user?.id}
    />
  );
}