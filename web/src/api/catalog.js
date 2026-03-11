import API from './axios';

export async function catalogProgramsApi(params = {}) {
  const qs = new URLSearchParams();
  if (params.sort) qs.set('sort', params.sort);
  if (params.dir) qs.set('dir', params.dir);
  const { data } = await API.get(`/catalog/programs?${qs.toString()}`);
  return data.programs;
}

export async function catalogSubjectsApi(params = {}) {
  const qs = new URLSearchParams();
  if (params.program) qs.set('program', params.program);
  if (params.required != null) qs.set('required', String(params.required));
  if (params.sort) qs.set('sort', params.sort);
  if (params.dir) qs.set('dir', params.dir);
  const { data } = await API.get(`/catalog/subjects?${qs.toString()}`);
  return data.subjects;
}

export async function catalogSchoolYearsApi() {
  const { data } = await API.get('/catalog/school-years');
  return data.school_years;
}

export async function catalogPeriodsApi(params = {}) {
  const qs = new URLSearchParams();
  if (params.school_year_id) qs.set('school_year_id', params.school_year_id);
  const { data } = await API.get(`/catalog/periods?${qs.toString()}`);
  return data.periods;
}