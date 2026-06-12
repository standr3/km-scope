
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getProjectWithMembersApi } from '../api/project';
import ProjectShell from '../components/ProjectShell';
import ProjectView from '../components/ProjectView.jsx';
import { ReactFlowProvider } from '@xyflow/react';
import { ProjectUsersProvider } from '../context/ProjectUsersContext';
import { ProjectShellProvider } from '../context/ProjectShellContext';

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
  // console.log(project)
  return (
    <ProjectShellProvider>
      <ProjectShell projectRole={isOwner ? 'OWNER' : 'GUEST'}>
        <ReactFlowProvider>
          <ProjectUsersProvider value={projectUsersValue}>
            <ProjectView
              project={project}
              projectRole={isOwner ? 'OWNER' : 'GUEST'}
            />
          </ProjectUsersProvider>
        </ReactFlowProvider>
      </ProjectShell>
    </ProjectShellProvider>
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
    return <p className="p-6">Loading…</p>;
  }

  if (q.isError || !q.data) {
    return <p className="p-6">Error loading project.</p>;
  }

  return (
    <ProjectPageContent
      project={q.data}
      currentUserId={user?.id}

    />
  );
}