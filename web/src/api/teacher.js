import API from './axios';

export async function listTeacherClassesApi(){ const {data}=await API.get('/teacher/classes'); return data.classes; }
export async function listTeacherProjectsApi(classId){ const {data}=await API.get(`/teacher/classes/${classId}/projects`); return data.projects; }
export async function createTeacherProjectApi(classId, body){ const {data}=await API.post(`/teacher/classes/${classId}/projects`, body); return data.project; }
export async function updateTeacherProjectApi(id, body){ const {data}=await API.put(`/teacher/projects/${id}`, body); return data.project; }
export async function deleteTeacherProjectApi(id){ const {data}=await API.delete(`/teacher/projects/${id}`); return data.success; }