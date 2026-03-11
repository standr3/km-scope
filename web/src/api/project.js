// src/api/project.js
import API from "./axios";

export async function getProjectApi(projectId) {
  const { data } = await API.get(`/project/${projectId}`);
  return data.project;
}

export async function getProjectWithMembersApi(projectId) {
  const { data } = await API.get(`/project/${projectId}/members`);
  return data.project;
}

// --------------------
// NODES
// --------------------
export async function listProjectNodesApi(projectId) {
  const { data } = await API.get(`/project/${projectId}/nodes`);
  return { nodes: data.nodes };
}

export async function createProjectNodeApi(projectId, payload) {
  const { data } = await API.post(`/project/${projectId}/nodes`, payload);
  return data; // { success, node, opinion }
}

export async function deleteProjectNodeApi(projectId, nodeId) {
  const { data } = await API.delete(`/project/${projectId}/nodes/${nodeId}`);
  return data; // { success }
}

export async function upsertNodeReviewApi(projectId, nodeId, payload) {
  const { data } = await API.patch(
    `/project/${projectId}/nodes/${nodeId}/review`,
    payload,
  );
  return data;
}

// --------------------
// EDGES
// --------------------
export async function listProjectEdgesApi(projectId) {
  const { data } = await API.get(`/project/${projectId}/edges`);
  return { edges: data.edges };
}

export async function createProjectEdgeApi(projectId, payload) {
  const { data } = await API.post(`/project/${projectId}/edges`, payload);
  return data;
}
export async function deleteProjectEdgeApi(projectId, edgeId) {
  const { data } = await API.delete(`/project/${projectId}/edges/${edgeId}`);
  return data;
}

export async function upsertEdgeReviewApi(projectId, edgeId, payload) {
  
  const { data } = await API.patch(
    `/project/${projectId}/edges/${edgeId}/review`,
    payload,
  );
  return data;
}

export async function setEdgeOwnerDecisionApi(projectId, edgeId, payload) {
  const { data } = await API.patch(
    `/project/${projectId}/edges/${edgeId}/owner-decision`,
    payload,
  );
  return data;
}
