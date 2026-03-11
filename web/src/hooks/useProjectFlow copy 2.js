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

import * as edgePolicy from "../policies/edgePolicy";
import * as nodePolicy from "../policies/nodePolicy";

export function useProjectFlow({ project, user, viewRole, members }) {
  const qc = useQueryClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  console.log("nodes1", nodes[(0)?.data?.ownerReview]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Semnături ca să păstrăm referințele vechi când nu s-a schimbat nimic important
  const nodeSigByIdRef = useRef(new Map());
  const edgeSigByIdRef = useRef(new Map());

  // Grace window pt dispariții temporare (refetch/lag) ca să nu “flicker”
  const missingNodeSinceRef = useRef(new Map());
  const missingEdgeSinceRef = useRef(new Map());

  const projectId = project?.id ?? null;
  const projectAuthorId = project?.owner_id ?? null;
  const currentUserId = user?.id ?? null;

  const rfInstanceRef = useRef(null);
  const firstViewportAppliedRef = useRef(false);
  const persistedPositionsRef = useRef({});

  const [loggedChanges, setLoggedChanges] = useState([]);

  const membersById = useMemo(() => {
    return Object.fromEntries(
      (members || []).map((m) => [m.id, { name: m.name, role: m.role }]),
    );
  }, [members]);

  const gridPos = useCallback((idx) => {
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    return { x: col * 220, y: row * 140 };
  }, []);

  const isAbandoned = useCallback((el) => !!el?.reviews?.abandoned, []);
  const getCreator = useCallback((el) => el?.reviews?.creator ?? null, []);

  const getReviewSpecs = useCallback((el) => {
    const likedBy = el?.reviews?.guestReviews?.likedBy ?? [];
    const dislikedBy = el?.reviews?.guestReviews?.dislikedBy ?? [];

    const likes = Array.isArray(likedBy) ? likedBy.length : 0;
    const dislikes = Array.isArray(dislikedBy) ? dislikedBy.length : 0;

    const reviewsCount = likes + dislikes;
    const approvalRate =
      reviewsCount > 0 ? Math.round((likes / reviewsCount) * 100) : 0;

    return { reviewsCount, approvalRate };
  }, []);

  // -------------------------
  // Queries
  // -------------------------
  const queryKeyNodes = useMemo(() => flowKeys.nodes(projectId), [projectId]);
  const queryKeyEdges = useMemo(() => flowKeys.edges(projectId), [projectId]);

  const nodesQuery = useQuery({
    queryKey: queryKeyNodes,
    queryFn: () => listProjectNodesApi(projectId),
    enabled: Boolean(projectId),
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const edgesQuery = useQuery({
    queryKey: queryKeyEdges,
    queryFn: () => listProjectEdgesApi(projectId),
    enabled: Boolean(projectId),
    // refetchInterval: 2000,
  });

  const nodesFetching = nodesQuery.isFetching;
  const edgesFetching = edgesQuery.isFetching;

  const nodeModels = useMemo(() => {
    // console.log(" ---- nodesQuery.data?.nodes update ----" )
    return (nodesQuery.data?.nodes || []).map(toNodeModel).filter(Boolean);
  }, [nodesQuery.data?.nodes]);
  console.log("nodeModels ", nodeModels[0]?.reviews?.ownerReview ?? "null");

  // const raw = (nodesQuery.data?.nodes || []).find(n => n.id == "7160492c-fa15-45b5-967c-342739cfae0e");
  // console.log("RAW", {
  //   owner_review: raw?.owner_review,
  //   ownerReview: raw?.ownerReview,
  //   owner_decision: raw?.owner_decision,
  //   ownerDecision: raw?.ownerDecision,
  // });

  // console.log("nodes updatedAt", nodesQuery.dataUpdatedAt, "fetch", nodesQuery.fetchStatus);

  const edgeModels = useMemo(() => {
    return (edgesQuery.data?.edges || []).map(toEdgeModel).filter(Boolean);
  }, [edgesQuery.data?.edges]);

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

  const onNodeReview = useCallback(
    async (nodeId, verdictOrNull) => {
      await setNodeReviewMut.mutateAsync({
        nodeId,
        verdict: verdictOrNull,
      });
    },
    [setNodeReviewMut],
  );

  // const deleteNodeMut = useMutation({
  //   mutationFn: (nodeId) => deleteProjectNodeApi(projectId, nodeId),

  //   onMutate: async (nodeId) => {
  //     // oprește refetch-ul ca să nu-ți suprascrie optimistic update-ul
  //     await qc.cancelQueries({ queryKey: queryKeyNodes });
  //     await qc.cancelQueries({ queryKey: queryKeyEdges });

  //     const prevNodesData = qc.getQueryData(queryKeyNodes);
  //     const prevEdgesData = qc.getQueryData(queryKeyEdges);

  //     // 1) UI optimistic (ReactFlow state)
  //     setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  //     setEdges((prev) =>
  //       prev.filter((e) => e.source !== nodeId && e.target !== nodeId),
  //     );

  //     // 2) Cache optimistic (React Query)
  //     qc.setQueryData(queryKeyNodes, (old) => {
  //       if (!old?.nodes) return old;
  //       return { ...old, nodes: old.nodes.filter((n) => n.id !== nodeId) };
  //     });

  //     qc.setQueryData(queryKeyEdges, (old) => {
  //       if (!old?.edges) return old;
  //       return {
  //         ...old,
  //         edges: old.edges.filter(
  //           (e) =>
  //             e.source_id !== nodeId &&
  //             e.target_id !== nodeId &&
  //             e.sourceId !== nodeId &&
  //             e.targetId !== nodeId,
  //         ),
  //       };
  //     });

  //     return { prevNodesData, prevEdgesData };
  //   },

  //   onError: (_err, _nodeId, ctx) => {
  //     // rollback
  //     if (ctx?.prevNodesData) qc.setQueryData(queryKeyNodes, ctx.prevNodesData);
  //     if (ctx?.prevEdgesData) qc.setQueryData(queryKeyEdges, ctx.prevEdgesData);

  //     // rollback UI state (cel mai safe: refetch imediat)
  //     qc.invalidateQueries({ queryKey: queryKeyNodes });
  //     qc.invalidateQueries({ queryKey: queryKeyEdges });
  //   },

  //   onSettled: () => {
  //     qc.invalidateQueries({ queryKey: queryKeyNodes });
  //     qc.invalidateQueries({ queryKey: queryKeyEdges });
  //   },
  // });

  const deleteNodeMut = useMutation({
    mutationFn: (nodeId) => deleteProjectNodeApi(projectId, nodeId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeyNodes });
      qc.invalidateQueries({ queryKey: queryKeyEdges });
    },
  });
  const onNodeDelete = useCallback(
    async (nodeId) => {
      await deleteNodeMut.mutateAsync(nodeId);
    },
    [deleteNodeMut],
  );

  const createNodeMut = useMutation({
    mutationFn: ({ label }) => createProjectNodeApi(projectId, { label }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeyNodes }),
  });

  const onNodeCreate = useCallback(
    async ({ label }) => {
      return await createNodeMut.mutateAsync({ label });
    },
    [createNodeMut],
  );

  const upsertEdgeReviewMut = useMutation({
    mutationFn: ({ edgeId, verdict }) =>
      upsertEdgeReviewApi(projectId, edgeId, { verdict }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyEdges }),
  });

  const onEdgeReview = useCallback(
    async (edgeId, verdictOrNull) => {
      await upsertEdgeReviewMut.mutateAsync({ edgeId, verdict: verdictOrNull });
    },
    [upsertEdgeReviewMut],
  );

  const deleteEdgeMut = useMutation({
    mutationFn: (edgeId) => deleteProjectEdgeApi(projectId, edgeId),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyEdges }),
  });

  const onEdgeDelete = useCallback(
    async (edgeId) => {
      await deleteEdgeMut.mutateAsync(edgeId);
    },
    [deleteEdgeMut],
  );

  const decideEdgeMut = useMutation({
    mutationFn: ({ edgeId, decision }) =>
      setEdgeOwnerDecisionApi(projectId, edgeId, { decision }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyEdges }),
  });

  const onEdgeDecide = useCallback(
    async (edgeId, decisionOrNull) => {
      if (decisionOrNull == null) return;
      await decideEdgeMut.mutateAsync({ edgeId, decision: decisionOrNull });
    },
    [decideEdgeMut],
  );

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
  const desiredNodes = useMemo(() => {
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

      // console.log("MODEL DATA_FROM_POLICY", n, data);
      // console.log("DATA_FROM_POLICY", data);

      // console.log("changed in desiredNodes", data?.ownerReview);

      return {
        id: n.id,
        type: "custom",
        position: pos,
        data: data,
      };
    });
  }, [
    nodesFetching,
    nodeModels,
    gridPos,
    currentUserId,
    projectAuthorId,
    membersById,
    getCreator,
    getReviewSpecs,
    isAbandoned,
    onNodeReview,
    onNodeDelete,
  ]);

  // console.log("desiredNodes", desiredNodes[0])

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
            onDecide: onEdgeDecide,
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
    currentUserId,
    projectAuthorId,
    // nodeMetaById,
    viewRole,
    onEdgeReview,
    onEdgeDelete,
    onEdgeDecide,
  ]);

  // -------------------------
  // Signatures (UI-relevant only)
  // -------------------------
  const MISSING_GRACE_MS = 1500;

  const nodeSig = useCallback((dn) => {
    // console.log(dn)
    // {
    //     "id": "7160492c-fa15-45b5-967c-342739cfae0e",
    //     "type": "custom",
    //     "position": {
    //         "x": 0,
    //         "y": 0
    //     },
    //     "data": {
    //         "id": "7160492c-fa15-45b5-967c-342739cfae0e",
    //         "label": "1",
    //         "creatorId": "adde0c26-c8ef-4023-a7f2-44f0a8e2fdeb",
    //         "creatorName": "tests1",
    //         "abandoned": false,
    //         "ownerReview": null,
    //         "likedBy": [],
    //         "dislikedBy": [],
    //         "likesCount": 0,
    //         "dislikesCount": 0,
    //         "approvalRate": 0,
    //         "currentUserId": "900cb8ec-caa2-4f77-9be6-7718fcb14adf",
    //         "affinityBarColor": "orange",
    //         "pillColor": "orange",
    //         "pillText": "Pending",
    //         "lastReview": null,
    //         "canDelete": false,
    //         "canReview": true,
    //         "onDelete": null
    //     }
    // }

    const d = dn?.data ?? {};
    // const r = d?.reviews ?? {};
    // const gr = r?.guestReviews ?? {};
    // const likedBy = Array.isArray(gr.likedBy) ? gr.likedBy : [];
    // const dislikedBy = Array.isArray(gr.dislikedBy) ? gr.dislikedBy : [];

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

      // r.ownerReview ?? "null",
      // r.abandoned ? "1" : "0",
      // likedBy.length,
      // dislikedBy.length,

      // // UI props that affect rendering
      // d.uiState ?? "",
      // d.pillMeta?.name ?? "",
      // d.pillMeta?.color ?? "",
      // d.affinityBarColor ?? "",
      // d.canReview ? "1" : "0",
      // d.canDelete ? "1" : "0",
      // d.viewerVerdict ?? "null",

      // // handlers presence affects enabled buttons
      // d.onReview ? "R1" : "R0",
      // d.onDelete ? "D1" : "D0",
    ].join("|");
  }, []);

  const edgeSig = useCallback(
    (de) => {
      const d = de?.data ?? {};
      const r = d?.reviews ?? {};
      const gr = r?.guestReviews ?? {};
      const likedBy = Array.isArray(gr.likedBy) ? gr.likedBy : [];
      const dislikedBy = Array.isArray(gr.dislikedBy) ? gr.dislikedBy : [];

      const mine =
        currentUserId &&
        (likedBy.includes(currentUserId)
          ? "U"
          : dislikedBy.includes(currentUserId)
            ? "D"
            : "N");

      const stroke = de?.style?.stroke ?? "";
      const dash = de?.style?.strokeDasharray ?? "";

      return [
        de.id ?? "",
        de.source ?? "",
        de.target ?? "",
        stroke,
        dash,
        r.ownerReview ?? "null",
        r.abandoned ? "1" : "0",
        likedBy.length,
        dislikedBy.length,
        mine ?? "X",

        d.edgeAutoDisliked ? "1" : "0",
        d.uiState ?? "",

        d.onReview ? "R1" : "R0",
        d.onDelete ? "D1" : "D0",
        d.onDecide ? "O1" : "O0",
      ].join("|");
    },
    [currentUserId],
  );

  // -------------------------
  // Reconcile nodes: server overwrite + keep local truth for position/tmp-*
  // -------------------------
  useEffect(() => {
    const prev = nodes;
    console.log("prev", prev[0]?.data?.ownerReview);

    const now = Date.now();

    const prevById = new Map(prev.map((n) => [n.id, n]));
    const next = [];
    let changed = false;

    for (const dn of desiredNodes) {
      const prevNode = prevById.get(dn.id);
      console.log("dn.data", dn.data?.ownerReview);

      const sig = nodeSig(dn);
      // console.log(sig)

      const oldSig = nodeSigByIdRef.current.get(dn.id);
      // console.log(oldSig)

      missingNodeSinceRef.current.delete(dn.id);

      if (!prevNode) {
        // adding new node
        nodeSigByIdRef.current.set(dn.id, sig);
        next.push(dn);
        changed = true;
      } else if (oldSig !== sig) {
        console.log(
          "oldSig !== sig",
          prevNode.data?.ownerReview,
          dn.data?.ownerReview,
          prevNode,
        );
        // changed
        nodeSigByIdRef.current.set(dn.id, sig);

        // local truth: position from prevNode
        next.push({
          ...prevNode,
          type: dn.type ?? prevNode.type,
          // data: { ...prevNode.data, ...dn.data },
          data: { ...dn.data },
        });
        // console.log(prevNode.data, dn.data)

        changed = true;
      } else {
        next.push(prevNode);
      }

      prevById.delete(dn.id);
    }

    // nodes missing from server: keep tmp-* forever, others within grace window
    for (const [id, pn] of prevById.entries()) {
      if (String(id).startsWith("tmp-")) {
        next.push(pn);
        continue;
      }

      // dacă NU mai fetch-uim și nodul lipsește din desiredNodes, îl scoatem imediat
      if (!nodesFetching) {
        nodeSigByIdRef.current.delete(id);
        missingNodeSinceRef.current.delete(id);
        changed = true;
        continue;
      }

      // dacă fetch-uim, aplicăm grace window (anti-flicker)
      const firstMissingAt = missingNodeSinceRef.current.get(id) ?? now;
      missingNodeSinceRef.current.set(id, firstMissingAt);

      if (now - firstMissingAt < MISSING_GRACE_MS) {
        next.push(pn);
      } else {
        nodeSigByIdRef.current.delete(id);
        missingNodeSinceRef.current.delete(id);
        changed = true;
      }
    }

    // const TEST_ID = nodeModels[0]?.id;
    // const prevN = prev.find((n) => n.id === TEST_ID);
    // const nextN = next.find((n) => n.id === TEST_ID);
    // console.log(
    //   "changed",

    //   changed,
    //   prevN?.data?.ownerReview,
    //   nextN?.data?.ownerReview,
    // );
    const res = changed ? next : prev;
    console.log("useEffect - res", res[0]?.data?.ownerReview);

    console.log("changed", changed);

    if (next != [] && changed) setNodes(next);
    
  }, [desiredNodes[0]?.data?.ownerReview]);
  console.log("useEffect - nodes", nodes[0]?.data?.ownerReview);

  // -------------------------
  // Reconcile edges: server overwrite + keep optimistic tmp-*
  // -------------------------
  useEffect(() => {
    setEdges((prev) => {
      const now = Date.now();

      const prevById = new Map(prev.map((e) => [e.id, e]));
      const next = [];
      let changed = false;

      for (const de of desiredEdges) {
        const prevEdge = prevById.get(de.id);
        const sig = edgeSig(de);
        const oldSig = edgeSigByIdRef.current.get(de.id);

        missingEdgeSinceRef.current.delete(de.id);

        if (!prevEdge) {
          edgeSigByIdRef.current.set(de.id, sig);
          next.push(de);
          changed = true;
        } else if (oldSig !== sig) {
          edgeSigByIdRef.current.set(de.id, sig);

          // edges: păstrează referința doar dacă nu s-a schimbat; dacă s-a schimbat, patch minim
          next.push({
            ...prevEdge,
            source: de.source ?? prevEdge.source,
            target: de.target ?? prevEdge.target,
            markerEnd: de.markerEnd ?? prevEdge.markerEnd,
            style: de.style ?? prevEdge.style,
            data: { ...prevEdge.data, ...de.data },
          });
          changed = true;
        } else {
          next.push(prevEdge);
        }

        prevById.delete(de.id);
      }

      for (const [id, pe] of prevById.entries()) {
        if (String(id).startsWith("tmp-")) {
          next.push(pe);
          continue;
        }

        const firstMissingAt = missingEdgeSinceRef.current.get(id) ?? now;
        missingEdgeSinceRef.current.set(id, firstMissingAt);

        if (now - firstMissingAt < MISSING_GRACE_MS) {
          next.push(pe);
        } else {
          edgeSigByIdRef.current.delete(id);
          missingEdgeSinceRef.current.delete(id);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [desiredEdges, edgeSig, setEdges]);

  // -------------------------
  // ReactFlow actions
  // -------------------------
  const onConnect = useCallback(
    async (connection) => {
      const sourceId = connection?.source ?? null;
      const targetId = connection?.target ?? null;
      if (!sourceId || !targetId || sourceId === targetId) return;

      const tempId = `tmp-${sourceId}-${targetId}-${Date.now()}`;

      // optimistic
      setEdges((eds) =>
        addEdge(
          {
            id: tempId,
            type: "custom",
            source: sourceId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: { strokeDasharray: "6 4" },
            data: {
              currentUserId,
              reviews: {
                creator: currentUserId,
                abandoned: false,
                ownerReview: null,
                guestReviews: { likedBy: [], dislikedBy: [] },
                approvalRate: 0,
                likesCount: 0,
                dislikesCount: 0,
              },
              onDelete: viewRole === "guest" ? onEdgeDelete : null,
              onReview: viewRole === "guest" ? onEdgeReview : null,
              onDecide: viewRole === "owner" ? onEdgeDecide : null,
            },
          },
          eds,
        ),
      );

      try {
        const res = await onEdgeCreate({ sourceId, targetId });
        const created = toEdgeModel(res?.edge);

        if (!created?.id) {
          qc.invalidateQueries({ queryKey: queryKeyEdges });
          return;
        }

        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === tempId
              ? {
                  ...edge,
                  id: created.id,
                  source: created.sourceId ?? sourceId,
                  target: created.targetId ?? targetId,
                  data: {
                    ...edge.data,
                    ...created,
                    reviews: created.reviews ?? edge.data?.reviews,
                  },
                }
              : edge,
          ),
        );
      } catch {
        setEdges((eds) => eds.filter((edge) => edge.id !== tempId));
      }
    },
    [
      currentUserId,
      viewRole,
      onEdgeCreate,
      onEdgeDelete,
      onEdgeReview,
      onEdgeDecide,
      qc,
      queryKeyEdges,
      setEdges,
    ],
  );

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

  const onNodesChangeDevLog = useCallback((changes) => {
    setLoggedChanges((old) => [...changes, ...old].slice(0, 20));
  }, []);

  // Mutarea butonului “Add node” în hook (centered add)
  const addNodeAtCenter = useCallback(async () => {
    const label = window.prompt("Node title:");
    if (!label) return;

    // const res = await onNodeCreate({ label });
    // const createdId = res?.node?.id;
    // if (!createdId) return;

    const centerScreen = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const pos = rfInstanceRef.current?.screenToFlowPosition
      ? rfInstanceRef.current.screenToFlowPosition(centerScreen)
      : { x: 0, y: 0 };

    const tempId = `temp-${Date.now()}`;
    const mockNodeModel = {
      id: tempId,
      label,
      reviews: {
        creator: currentUserId, // Tu ești creatorul
        abandoned: false,
        ownerReview: null,
        guestReviews: { likedBy: [], dislikedBy: [] },
        likesCount: 0,
        dislikesCount: 0,
        approvalRate: 0,
      },
    };
    const ui = nodePolicy.getNodeUiState({
      node: mockNodeModel,
      currentUserId,
      projectAuthorId, // Ai nevoie de owner_id din prop-ul project
    });
    const perms = nodePolicy.getNodePermissions({
      node: mockNodeModel,
      currentUserId,
      projectAuthorId,
    });
    const optimisticNode = {
      id: tempId,
      type: "custom",
      position: pos,
      data: {
        ...nodePolicy.buildNodeDataProps({
          node: mockNodeModel,
          currentUserId,
          perms,
          ui,
          handlers: {
            // Aici refolosești funcțiile de review/delete deja definite în hook
            onReview: onNodeReview,
            onDelete: onNodeDelete,
          },
        }),
        creator: membersById[getCreator(mockNodeModel)]?.name || null,
        reviewSpecs: getReviewSpecs(mockNodeModel),
        isAbandoned: false,
      },
    };

    setNodes((prev) => {
      const next = [...prev, optimisticNode];
      persistNodePositions(next); // Salvăm poziția să nu sară la refresh
      return next;
    });
    try {
      const res = await onNodeCreate({ label });

      // Când serverul răspunde cu ID-ul real, actualizăm doar ID-ul
      if (res?.node?.id) {
        setNodes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: res.node.id } : n)),
        );
      }
    } catch (err) {
      console.error(err);
      // Dacă crapă serverul, ștergem nodul temporar
      setNodes((prev) => prev.filter((n) => n.id !== tempId));
      alert("Error creating node");
    }
  }, [
    currentUserId,
    project,
    onNodeReview,
    onNodeDelete,
    onNodeCreate,
    setNodes,
    persistNodePositions,
  ]);

  // console.log("nodes final", nodes[0]?.data?.ownerReview);
  // useEffect(() => {
  //   console.log("nodes state changed", nodes[0]?.data?.ownerReview);
  // }, [nodes[0]?.data?.ownerReview]);
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
    addNodeAtCenter,

    // persistence + refs
    rfInstanceRef,
    applyViewportOnce,
    onMoveEnd,
    persistNodePositions,

    // dev
    loggedChanges,
    onNodesChangeDevLog,
  };
}
