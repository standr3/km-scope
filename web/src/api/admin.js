import API from './axios';

export async function adminOverviewApi() {
  const { data } = await API.get('/admin/overview'); return data;
}
export async function acceptRequestApi(id) {
  const { data } = await API.post(`/admin/requests/${id}/accept`); return data;
}
export async function revokeMemberApi(membershipId) {
  const { data } = await API.post(`/admin/members/${membershipId}/revoke`); return data;
}

export async function listProgramsApi(p={}) {
  const qs=new URLSearchParams(); if(p.sort)qs.set('sort',p.sort); if(p.dir)qs.set('dir',p.dir);
  const { data } = await API.get(`/admin/programs?${qs}`); return data.programs;
}
export async function createProgramApi(b){ const {data}=await API.post('/admin/programs',b); return data.program; }
export async function updateProgramApi(id,b){ const {data}=await API.put(`/admin/programs/${id}`,b); return data.program; }
export async function deleteProgramApi(id){ const {data}=await API.delete(`/admin/programs/${id}`); return data.success; }

export async function listSubjectsAdminApi(p={}) {
  const qs=new URLSearchParams();
  if(p.program)qs.set('program',p.program);
  if(p.required!=null)qs.set('required',String(p.required));
  if(p.sort)qs.set('sort',p.sort); if(p.dir)qs.set('dir',p.dir);
  const { data } = await API.get(`/admin/subjects?${qs}`); return data.subjects;
}
export async function createSubjectApi(b){ const {data}=await API.post('/admin/subjects',b); return data.subject; }
export async function updateSubjectApi(id,b){ const {data}=await API.put(`/admin/subjects/${id}`,b); return data.success; }
export async function deleteSubjectApi(id){ const {data}=await API.delete(`/admin/subjects/${id}`); return data.success; }

export async function listSchoolYearsAdminApi(){ const {data}=await API.get('/admin/school-years'); return data.school_years; }
export async function createSchoolYearApi(b){ const {data}=await API.post('/admin/school-years',b); return data.school_year; }
export async function updateSchoolYearApi(id,b){ const {data}=await API.put(`/admin/school-years/${id}`,b); return data.school_year; }
export async function deleteSchoolYearApi(id){ const {data}=await API.delete(`/admin/school-years/${id}`); return data.success; }

export async function listPeriodsAdminApi(p={}){ const qs=new URLSearchParams(); if(p.school_year_id)qs.set('school_year_id',p.school_year_id); const {data}=await API.get(`/admin/periods?${qs}`); return data.periods; }
export async function createPeriodApi(b){ const {data}=await API.post('/admin/periods',b); return data.period; }
export async function updatePeriodApi(id,b){ const {data}=await API.put(`/admin/periods/${id}`,b); return data.period; }
export async function deletePeriodApi(id){ const {data}=await API.delete(`/admin/periods/${id}`); return data.success; }

export async function listClassroomsAdminApi(){ const {data}=await API.get('/admin/classrooms'); return data.classrooms; }
export async function createClassroomApi(b){ const {data}=await API.post('/admin/classrooms',b); return data.classroom; }
export async function updateClassroomApi(id,b){ const {data}=await API.put(`/admin/classrooms/${id}`,b); return data.classroom; }
export async function deleteClassroomApi(id){ const {data}=await API.delete(`/admin/classrooms/${id}`); return data.success; }
export async function listClassroomStudentsApi(id){ const {data}=await API.get(`/admin/classrooms/${id}/students`); return data.students; }
export async function addStudentToClassroomApi(id,b){ const {data}=await API.post(`/admin/classrooms/${id}/students/add`,b); return data.success; }
export async function removeStudentFromClassroomApi(id,b){ const {data}=await API.post(`/admin/classrooms/${id}/students/remove`,b); return data.success; }

export async function listClassesAdminApi(){ const {data}=await API.get('/admin/classes'); return data.classes; }
export async function createClassAdminApi(b){ const {data}=await API.post('/admin/classes',b); return data.class; }
export async function updateClassAdminApi(id,b){ const {data}=await API.put(`/admin/classes/${id}`,b); return data.class; }
export async function deleteClassAdminApi(id){ const {data}=await API.delete(`/admin/classes/${id}`); return data.success; }