const KEY = (u, p) => `rf:vp:${u}:${p}:v1`;

export function loadViewport(userId, projectId) {
  try {
    const raw = localStorage.getItem(KEY(userId, projectId));
    return raw ? JSON.parse(raw) : null; // { x, y, zoom }
  } catch { return null; }
}

export function saveViewport(userId, projectId, vp) {
  try { localStorage.setItem(KEY(userId, projectId), JSON.stringify(vp)); } catch {}
}
