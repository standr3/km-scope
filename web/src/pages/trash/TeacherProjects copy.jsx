import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTeacherProjectsApi,
  createTeacherProjectApi,
  updateTeacherProjectApi,
  deleteTeacherProjectApi
} from '../api/teacher';

export default function TeacherProjects() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['teacher-projects', classId],
    queryFn: () => listTeacherProjectsApi(classId)
  });

  const createM = useMutation({
    mutationFn: (body) => createTeacherProjectApi(classId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-projects', classId] })
  });

  const updateM = useMutation({
    mutationFn: ({ pid, body }) => updateTeacherProjectApi(pid, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-projects', classId] })
  });

  const deleteM = useMutation({
    mutationFn: deleteTeacherProjectApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-projects', classId] })
  });

  const [name, setName] = useState('');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h3>Projects for class</h3>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => name && createM.mutate({ name })}>Create</button>
      </div>

      {q.isLoading && <p>Loading…</p>}

      <ul style={{ display: 'grid', gap: 8 }}>
        {(q.data || []).map((p) => (
          <li
            key={p.id}
            onClick={() => navigate(`/dashboard/teacher/classes/${classId}/projects/${p.id}`)}
            style={{
              border: '1px solid #eee',
              padding: 10,
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            <b>{p.name}</b>

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nn = prompt('New name', p.name);
                  if (nn != null) updateM.mutate({ pid: p.id, body: { name: nn } });
                }}
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteM.mutate(p.id);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
