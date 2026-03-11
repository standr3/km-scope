import API from './axios';

export async function listNotesApi() {
  const res = await API.get('/notes');
  return res.data.notes;
}
export async function getNoteApi(id) {
  const { data } = await API.get(`/notes/${id}`);
  return data.note;
}
export async function createNoteApi(body) {
  const { data } = await API.post('/notes', body);
  return data.note;
}
export async function updateNoteApi(id, body) {
  const { data } = await API.put(`/notes/${id}`, body);
  return data.note;
}
export async function deleteNoteApi(id) {
  const { data } = await API.delete(`/notes/${id}`);
  return data.success;
}
