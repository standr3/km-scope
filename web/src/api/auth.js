import API, { setAccess } from './axios';

export async function loginApi(body) {
  const { data } = await API.post('/auth/login', body);
  if (data?.access_token) setAccess(data.access_token);
  return data;
}

export async function registerSchoolApi(payload) {
  const { data } = await API.post('/auth/register-school', payload);
  if (data?.access_token) setAccess(data.access_token);
  return data;
}

export async function registerMemberApi(payload) {
  // payload: { name, email, password, school_id, role: 'teacher'|'student' }
  const { data } = await API.post('/auth/register-member', payload);
  if (data?.access_token) setAccess(data.access_token);
  return data;
}

export async function checkAuthApi() {
  const { data } = await API.get('/auth/check-auth');
  return { user: data.user, roles: data.roles || [], pendingRequests: data.pendingRequests || [] };
}

export async function logoutApi() {
  const { data } = await API.post('/auth/logout');
  setAccess('');
  return data;
}
