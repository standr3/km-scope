// src/flows/flowKeys.js

export const flowKeys = {
  nodes: (projectId) => ['project-nodes', projectId],
  edges: (projectId) => ['project-edges', projectId],
  project: (projectId) => ['project', projectId],
};
