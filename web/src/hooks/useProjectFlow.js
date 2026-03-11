// src/hooks/useProjectFlow.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  MarkerType,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  listProjectNodesApi,
  createProjectNodeApi,
  deleteProjectNodeApi,
  listProjectEdgesApi,
  createProjectEdgeApi,
  deleteProjectEdgeApi,
  upsertEdgeReviewApi,
  setEdgeOwnerDecisionApi,
  upsertNodeReviewApi,
} from "../api/project";

import { loadNodePositions, saveNodePositions } from "../lib/nodePositions";
import { loadViewport, saveViewport } from "../lib/viewport";

import { flowKeys } from "../flows/flowKeys";
import { toNodeModel } from "../mappers/nodeMapper";
import { toEdgeModel } from "../mappers/edgeMapper";

import { gridPos } from "./utils.js";

import * as nodePolicy from "../policies/nodePolicy";
import * as edgePolicy from "../policies/edgePolicy";

export function useProjectFlow({ project, user, viewRole, members }) {
  const qc = useQueryClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const projectId = project?.id ?? null;
  const projectAuthorId = project?.owner_id ?? null;
  const currentUserId = user?.id ?? null;

  const rfInstanceRef = useRef(null);
  const firstViewportAppliedRef = useRef(false);
  const persistedPositionsRef = useRef({});

  const membersById = useMemo(() => {
    return Object.fromEntries(
      (members || []).map((m) => [m.id, { name: m.name, role: m.role }]),
    );
  }, [members]);

  // -------------------------
  // Queries
  // -------------------------
  const queryKeyNodes = useMemo(() => flowKeys.nodes(projectId), [projectId]);
  const queryKeyEdges = useMemo(() => flowKeys.edges(projectId), [projectId]);

  const nodesQuery = useQuery({
    queryKey: queryKeyNodes,
    queryFn: () => listProjectNodesApi(projectId),
    enabled: Boolean(projectId),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    console.log("=== [isFetching] nodesQuery === ");
  }, [nodesQuery.isFetching]);

  // const nodesFetching = nodesQuery.isFetching;  //causes rerender

  const nodeModels = useMemo(() => {
    console.log("-----node Models -----");
    return (nodesQuery.data?.nodes || []).map(toNodeModel).filter(Boolean);
  }, [nodesQuery.data?.nodes]);

  // -------------------------
  // Mutations
  // -------------------------
  const setNodeReviewMut = useMutation({
    mutationFn: ({ nodeId, verdict }) =>
      upsertNodeReviewApi(projectId, nodeId, { verdict }),
    onSettled: () => {
      // console.log("invalidateQueries");
      qc.invalidateQueries({ queryKey: queryKeyNodes });
    },
  });
  const setEdgeReviewMut = useMutation({
    mutationFn: ({ edgeId, verdict }) =>
      upsertEdgeReviewApi(projectId, edgeId, { verdict }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyEdges });
    },
  });

  const onNodeReview = useCallback(
    async (nodeId, verdictOrNull) => {
      await setNodeReviewMut.mutateAsync({
        nodeId,
        verdict: verdictOrNull,
      });
    },
    [setNodeReviewMut],
  );
  const onEdgeReview = useCallback(
    async (edgeId, verdictOrNull) => {
      await setEdgeReviewMut.mutateAsync({
        edgeId,
        verdict: verdictOrNull,
      });
    },
    [setEdgeReviewMut],
  );
  const deleteNodeMut = useMutation({
    mutationFn: (nodeId) => deleteProjectNodeApi(projectId, nodeId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyNodes });
      // qc.invalidateQueries({ queryKey: queryKeyEdges });
    },
  });
  const deleteEdgeMut = useMutation({
    mutationFn: (edgeId) => deleteProjectEdgeApi(projectId, edgeId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyEdges });
      // qc.invalidateQueries({ queryKey: queryKeyEdges });
    },
  });

  const onNodeDelete = useCallback(
    async (nodeId) => {
      await deleteNodeMut.mutateAsync(nodeId);
    },
    [deleteNodeMut],
  );
  const onEdgeDelete = useCallback(
    async (edgeId) => {
      await deleteEdgeMut.mutateAsync(edgeId);
    },
    [deleteEdgeMut],
  );

  const createNodeMut = useMutation({
    mutationFn: ({ label }) => createProjectNodeApi(projectId, { label }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyNodes }),
  });
  const onNodeCreate = useCallback(
    async ({ label }) => {
      return await createNodeMut.mutateAsync({ label });
    },
    [createNodeMut],
  );
  const addNode = () => {
    const label = window.prompt("Node title:");
    if (!label) return;
    onNodeCreate({ label });
  };
  // -------------------------
  // Persisted positions (load once per project/user)
  // -------------------------
  useEffect(() => {
    if (!projectId || !currentUserId) return;
    persistedPositionsRef.current =
      loadNodePositions(currentUserId, projectId) || {};
  }, [projectId, currentUserId]);

  // -------------------------
  // Desired nodes / edges (server truth mapped by policies)
  // -------------------------
  const nodeSig = (dn) => {
    if (!dn?.id) return "";
    const d = dn?.data ?? {};

    return [
      dn.id ?? "",
      // UI props that affect rendering
      d.label ?? "",
      d.abandoned ? "1" : "0",
      d.creatorName ?? "",
      "<" + d.ownerReview ?? "null" + ">",
      d.likesCount ?? "",
      d.dislikesCount ?? "",
      d.approvalRate ?? "",
      d.affinityBarColor ?? "",
      d.pillColor ?? "",
      d.pillText ?? "",
      d.lastReview ?? "null",
      d.canReview ? "1" : "0",
      d.canDelete ? "1" : "0",
      // handlers presence affects enabled buttons
      d.onReview ? "R1" : "R0",
      d.onDelete ? "D1" : "D0",
    ].join("|");
  };

  const desiredNodes = useMemo(() => {
    // console.log("desiredNodes");
    const persisted = persistedPositionsRef.current || {};
    const prevPositionsById = new Map(); // simplu aici; local truth e în nodes state

    return (nodeModels || []).map((n, i) => {
      const pos = persisted[n.id] || prevPositionsById.get(n.id) || gridPos(i);

      const ui = nodePolicy.getNodeUiState({
        node: n,
        currentUserId,
        projectAuthorId,
      });
      const perms = nodePolicy.getNodePermissions({
        node: n,
        currentUserId,
        projectAuthorId,
      });
      const data = nodePolicy.buildNodeDataProps({
        node: n,
        creator:
          { id: n.reviews.creator, ...membersById[n.reviews.creator] } || null,
        currentUserId,
        perms,
        ui,
        handlers: { onReview: onNodeReview, onDelete: onNodeDelete },
      });

      return {
        id: n.id,
        type: "custom",
        position: pos,
        data: data,
      };
    });
  }, [nodeModels]);

  useEffect(() => {
    let change = false;
    if (nodes.length !== desiredNodes.length) change = true;
    const nodesById = new Map(nodes.map((n) => [n.id, n]));

    for (const dn of desiredNodes) {
      const pn = nodesById.get(dn.id);
      if (!pn || nodeSig(dn) !== nodeSig(pn)) {
        change = true;
        break;
      }
    }

    if (change) {
      setNodes(desiredNodes);
      console.log("[CHANGE] setNodes ");
    }
  }, [desiredNodes]);

  // -------------------------
  // ReactFlow actions
  // -------------------------

  // -------------------------
  // viewport helpers
  // -------------------------
  const applyViewportOnce = useCallback(() => {
    if (!rfInstanceRef.current || firstViewportAppliedRef.current) return;
    const vp = loadViewport(currentUserId, projectId);
    if (
      vp &&
      typeof vp.x === "number" &&
      typeof vp.y === "number" &&
      typeof vp.zoom === "number"
    ) {
      rfInstanceRef.current.setViewport(vp);
    }
    firstViewportAppliedRef.current = true;
  }, [currentUserId, projectId]);

  const onMoveEnd = useCallback(
    (_, viewport) => {
      saveViewport(currentUserId, projectId, viewport);
    },
    [currentUserId, projectId],
  );

  const persistNodePositions = useCallback(
    (nodesArg) => {
      const next = {};
      for (const n of nodesArg || []) next[n.id] = n.position;
      persistedPositionsRef.current = next;
      saveNodePositions(currentUserId, projectId, next);
    },
    [currentUserId, projectId],
  );

  const edgesQuery = useQuery({
    queryKey: queryKeyEdges,
    queryFn: () => listProjectEdgesApi(projectId),
    enabled: Boolean(projectId),
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const edgeModels = useMemo(() => {
    return (edgesQuery.data?.edges || []).map(toEdgeModel).filter(Boolean);
  }, [edgesQuery.data?.edges]);

  const createEdgeMut = useMutation({
    mutationFn: ({ source_id, target_id }) =>
      createProjectEdgeApi(projectId, { source_id, target_id }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyEdges }),
  });

  const onEdgeCreate = useCallback(
    async ({ sourceId, targetId }) => {
      return await createEdgeMut.mutateAsync({
        source_id: sourceId,
        target_id: targetId,
      });
    },
    [createEdgeMut],
  );

  const onConnect = useCallback(
    async (connection) => {
      const sourceId = connection?.source ?? null;
      const targetId = connection?.target ?? null;
      if (!sourceId || !targetId || sourceId === targetId) return;

      // const tempId = `tmp-${sourceId}-${targetId}-${Date.now()}`;

      // optimistic
      // setEdges((eds) =>
      //   addEdge(
      //     {
      //       id: tempId,
      //       type: "custom",
      //       source: sourceId,
      //       target: targetId,
      //       markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      //       style: { strokeDasharray: "6 4" },
      //       data: {
      //         currentUserId,
      //         reviews: {
      //           creator: currentUserId,
      //           abandoned: false,
      //           ownerReview: null,
      //           guestReviews: { likedBy: [], dislikedBy: [] },
      //           approvalRate: 0,
      //           likesCount: 0,
      //           dislikesCount: 0,
      //         },
      //         onDelete: viewRole === "guest" ? onEdgeDelete : null,
      //         onReview: viewRole === "guest" ? onEdgeReview : null,
      //         onDecide: viewRole === "owner" ? onEdgeDecide : null,
      //       },
      //     },
      //     eds,
      //   ),
      // );

      try {
        const res = await onEdgeCreate({ sourceId, targetId });
        const created = toEdgeModel(res?.edge);

        if (!created?.id) {
          qc.invalidateQueries({ queryKey: queryKeyEdges });
          return;
        }

        // setEdges((eds) =>
        //   eds.map((edge) =>
        //     edge.id === tempId
        //       ? {
        //           ...edge,
        //           id: created.id,
        //           source: created.sourceId ?? sourceId,
        //           target: created.targetId ?? targetId,
        //           data: {
        //             ...edge.data,
        //             ...created,
        //             reviews: created.reviews ?? edge.data?.reviews,
        //           },
        //         }
        //       : edge,
        //   ),
        // );
      } catch {
        // setEdges((eds) => eds.filter((edge) => edge.id !== tempId));
      }
    },
    [
      // currentUserId,
      // viewRole,
      onEdgeCreate,
      // onEdgeDelete,
      // onEdgeReview,
      // onEdgeDecide,
      // qc,
      // queryKeyEdges,
      // setEdges,
    ],
  );

  const desiredEdges = useMemo(() => {
    return (edgeModels || [])
      .filter((e) => e.sourceId && e.targetId)
      .map((e) => {
        const ui = edgePolicy.getEdgeUiState({
          edge: e,
          currentUserId,
          projectAuthorId,
          // nodeMetaById,
          viewRole,
        });
        const perms = edgePolicy.getEdgePermissions({
          edge: e,
          currentUserId,
          projectAuthorId,
          // nodeMetaById,
          viewRole,
        });

        const data = edgePolicy.buildEdgeDataProps({
          edge: e,
          currentUserId,
          perms,
          ui,
          handlers: {
            onReview: onEdgeReview,
            onDelete: onEdgeDelete,
            onDecide: null,
          },
        });

        return {
          id: e.id,
          type: "custom",
          source: e.sourceId,
          target: e.targetId,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          // stilul derivat din policy (dacă ai dash etc, include-l aici)
          style: ui?.strokeDasharray
            ? { stroke: ui.strokeColor, strokeDasharray: ui.strokeDasharray }
            : { stroke: ui?.strokeColor },
          data,
        };
      });
  }, [
    edgeModels,
    // currentUserId,
    // projectAuthorId,
    // nodeMetaById,
    // viewRole,
    // onEdgeReview,
    // onEdgeDelete,
    // onEdgeDecide,
  ]);

  useEffect(() => {
    // let change = false;
    // if (nodes.length !== desiredNodes.length) change = true;
    // const nodesById = new Map(nodes.map((n) => [n.id, n]));

    // for (const dn of desiredNodes) {
    //   const pn = nodesById.get(dn.id);
    //   if (!pn || nodeSig(dn) !== nodeSig(pn)) {
    //     change = true;
    //     break;
    //   }
    // }

    // if (change) {
    setEdges(desiredEdges);
    // console.log("[CHANGE] setNodes ");
    // }
  }, [desiredEdges]);

  return {
    // xyflow state (local truth)
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,

    // optional
    // nodeMetaById,

    // query flags
    isLoading: nodesQuery.isLoading || edgesQuery.isLoading,
    isError: nodesQuery.isError || edgesQuery.isError,

    // actions
    onConnect,
    addNode,

    // persistence + refs
    rfInstanceRef,
    applyViewportOnce,
    onMoveEnd,
    persistNodePositions,
  };
}
