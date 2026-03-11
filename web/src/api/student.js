import API from './axios';

export async function listStudentClassesApi(){ const {data}=await API.get('/student/classes'); return data.classes; }
export async function listStudentProjectsApi(classId){ const {data}=await API.get(`/student/classes/${classId}/projects`); return data.projects; }