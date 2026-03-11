// src/lib/nodePositions.js
const KEY = (u, p) => `rf:pos:${u}:${p}:v1`;

export function loadNodePositions(userId, projectId) {
  try {
    const raw = localStorage.getItem(KEY(userId, projectId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveNodePositions(userId, projectId, positions) {
  try {
    localStorage.setItem(KEY(userId, projectId), JSON.stringify(positions || {}));
  } catch {}
}

export function getNodePosition(userId, projectId, nodeId) {
  const map = loadNodePositions(userId, projectId);
  return map?.[nodeId] ?? null;
}

export function setNodePosition(userId, projectId, nodeId, pos) {
  const map = loadNodePositions(userId, projectId);
  map[nodeId] = { x: pos.x, y: pos.y };
  saveNodePositions(userId, projectId, map);
  return map[nodeId];
}
