import API from './axios';
export async function listSchoolsApi() {
  const { data } = await API.get('/public/schools');
  return data.schools;
}
