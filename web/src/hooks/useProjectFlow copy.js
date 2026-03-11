// src/hooks/useProjectFlow.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEdge, MarkerType } from "@xyflow/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  listProjectNodesApi,
  createProjectNodeApi,
  deleteProjectNodeApi,
  upsertNodeReviewApi,
  listProjectEdgesApi,
  createProjectEdgeApi,
  deleteProjectEdgeApi,
  upsertEdgeReviewApi,
  setEdgeOwnerDecisionApi,
  setNodeOwnerDecisionApi,
} from "../api/project";

import { loadNodePositions, saveNodePositions } from "../lib/nodePositions";
import { loadViewport, saveViewport } from "../lib/viewport";

import { flowKeys } from "../flows/flowKeys";
import { toNodeModel } from "../mappers/nodeMapper";
import { toEdgeModel } from "../mappers/edgeMapper";

import * as edgePolicy from "../policies/edgePolicy";
import * as nodePolicy from "../policies/nodePolicy";
// import * as connectPolicy from "../policies/connectPolicy";

// import { useWhyDidYouUpdate } from "../components/useWhyDidYouUpdate";

/**
 * Centralizes:
 * - fetching nodes/edges
 * - mutations (create/delete/review/decide)
 * - mapping to XYFlow nodes/edges (with policies)
 * - viewport + position persistence
 *
 * Views become thin: they call this hook and render ReactFlow.
 */
export function useProjectFlow({ project, user, viewRole, members }) {
  const qc = useQueryClient();

  const membersById = useMemo(
    () =>
      Object.fromEntries(
        members.map((m) => [m.id, { name: m.name, role: m.role }]),
      ),
    [members],
  );
  // console.log(membersById);

  const projectId = project?.id;
  const projectAuthorId = project?.owner_id ?? null;
  const currentUserId = user?.id ?? null;
  // console.log("useProjectFlow",currentUserId, projectAuthorId);

  const rfInstanceRef = useRef(null);
  const firstViewportAppliedRef = useRef(false);
  const persistedPositionsRef = useRef({});

  const [loggedChanges, setLoggedChanges] = useState([]);

  const gridPos = useCallback((idx) => {
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    return { x: col * 220, y: row * 140 };
  }, []);

  // const isProjectOwner = currentUserId === projectAuthorId;

  // const CURR_ENDORSE_ACTION = isProjectOwner ? "APPROVE" : "LIKE";
  // const CURR_OPPOSE_ACTION = isProjectOwner ? "REJECT" : "DISLIKE";

  // const CURR_ENDORSED_STATE = isProjectOwner ? "APPROVED" : "LIKED";
  // const CURR_OPPOSED_STATE = isProjectOwner ? "REJECTED" : "DISLIKED";

  const isAbandoned = (el) => !!el.reviews?.abandoned;
  const getCreator = (el) => el?.reviews?.creator;
  // const isCreatedByOwner = (el) => el.reviews?.creator === projectAuthorId;
  // const isCreatedByCurrentUser = (el) => el.reviews?.creator === currentUserId;

  // const isOwnerEndorsed = (el) => el.reviews?.ownerReview === "APPROVED";
  // const isOwnerOpposed = (el) => el.reviews?.ownerReview === "REJECTED";
  // const isOwnerReviewed = (el) => isOwnerEndorsed(el) || isOwnerOpposed(el);

  // const isGuestEndorsed = (el) =>
  //   el.reviews?.guestReviews?.likedBy?.includes(currentUserId);
  // const isGuestOpposed = (el) =>
    // el.reviews?.guestReviews?.dislikedBy?.includes(currentUserId);
  // const isGuestReviewed = (el) => isGuestEndorsed(el) || isGuestOpposed(el);

  // // ownership rights (după definiția ta)
  // const hasOwnershipRights = (el) =>
  //   isProjectOwner
  //     ? isCreatedByCurrentUser(el)
  //     : isCreatedByCurrentUser(el) && !isAbandoned(el);

  // const affinityBarColor = (el) => {
  //   const mine = hasOwnershipRights(el);

  //   // BLACK: are ownership rights
  //   if (mine) return "black";

  //   // RED:
  //   // - guest: owner opposed (chiar și la elementul meu; dar "mine" e deja false aici) OR eu am opposed (la elementele care nu sunt ale mele)
  //   // - owner: eu am opposed la elemente care nu sunt ale mele
  //   if (isOwnerOpposed(el) || isGuestOpposed(el)) return "red";

  //   // GREEN:
  //   // - guest: eu am endorsed (la elemente care nu sunt ale mele)
  //   // - owner: eu am endorsed (la elemente care nu sunt ale mele) => ownerReview APPROVED
  //   if (
  //     (isOwnerEndorsed(el) && isProjectOwner) ||
  //     (isGuestEndorsed(el) && !isProjectOwner && !isOwnerEndorsed(el))
  //   )
  //     return "green";

  //   // ORANGE:
  //   // - owner: nu am dat review încă la un element care nu e al meu
  //   // - guest: nici eu, nici ownerul nu am dat review
  //   if (
  //     (isProjectOwner && !isOwnerReviewed(el)) ||
  //     (!isProjectOwner &&
  //       !isCreatedByOwner(el) &&
  //       !isOwnerReviewed(el) &&
  //       !isGuestReviewed(el))
  //   ) {
  //     return "orange";
  //   }

  //   // GRAY:
  //   // - nu am ownership rights și elementul e al ownerului sau endorsed by owner
  //   if (isCreatedByOwner(el) || isOwnerEndorsed(el)) return "gray";

  //   // fallback (cazuri rămase)
  //   return "white";
  // };

  // const pillMeta = (el) => {
  //   const createdByOwner = isCreatedByOwner(el);
  //   const createdByMe = isCreatedByCurrentUser(el);
  //   const abandoned = isAbandoned(el);

  //   // 1) Baseline: create de owner
  //   if (createdByOwner) return { color: "gray", name: "Baseline" };

  //   // 2) Owner verdict (doar pe noduri care NU sunt create de owner)
  //   if (!createdByOwner && isOwnerEndorsed(el))
  //     return { color: "green", name: "Approved" };
  //   if (!createdByOwner && isOwnerOpposed(el))
  //     return { color: "red", name: "Rejected" };

  //   // 3) Guest: Needs Review / Pending
  //   if (!isProjectOwner) {
  //     const reviewedByMe = isGuestReviewed(el);

  //     // a) Nodul MEU (creat de mine) și neabandonat: mereu "Pending"
  //     //    (indiferent dacă eu am dat like/dislike la ALTE noduri)
  //     if (createdByMe && !abandoned)
  //       return { color: "orange", name: "Pending" };

  //     // b) Nod care NU e al meu (sau e abandonat de creator):
  //     //    - dacă nu l-am review-uit încă => "Needs Review"
  //     //    - dacă l-am review-uit => rămâne "Pending" (ai acționat pe el)
  //     if (!createdByMe || abandoned) {
  //       if (!reviewedByMe) return { color: "orange", name: "Needs Review" };
  //       return { color: "orange", name: "Pending" };
  //     }
  //   }

  //   // 4) Owner: Pending pentru noduri necreate de el și încă nereview-uite de el
  //   if (isProjectOwner) {
  //     if (!createdByMe && !isOwnerReviewed(el))
  //       return { color: "orange", name: "Pending" };
  //   }

  //   // 5) Default
  //   return { color: "white", name: "Missing" };
  // };

  // const canReview = (el) => {
  //   const createdByOwner = isCreatedByOwner(el);
  //   const createdByMe = isCreatedByCurrentUser(el);
  //   const abandoned = isAbandoned(el);

  //   // OWNER: poate review-ui doar elemente care NU sunt create de owner
  //   if (isProjectOwner) {
  //     return !createdByOwner;
  //   }

  //   // GUEST: NU poate review-ui elemente create de owner (Baseline)
  //   if (createdByOwner) return false;

  //   // GUEST: dacă ownerul a dat deja verdict, guest nu mai poate review-ui
  //   if (isOwnerReviewed(el)) return false;

  //   // GUEST:
  //   // - element creat de alt guest și neabandonat
  //   // - sau element creat de mine, dar abandonat
  //   return (!createdByMe && !abandoned) || (createdByMe && abandoned);
  // };
  // const canDelete = (el) => {
  //   if (!isCreatedByCurrentUser(el)) return false;
  //   if (isOwnerReviewed(el)) return false;
  //   if (isProjectOwner) return true;

  //   return !isAbandoned(el);
  // };

  // const getViewerVerdict = (el) => {
  //   if (!el) return null;

  //   const reviews = el?.reviews || {};

  //   if (isProjectOwner) {
  //     const ownerVerdict = reviews?.ownerReview ?? null;
  //     if (ownerVerdict === "APPROVED") return "UP";
  //     if (ownerVerdict === "REJECTED") return "DOWN";
  //     return null;
  //   }

  //   const likedBy = reviews.guestReviews?.likedBy ?? [];
  //   const dislikedBy = reviews.guestReviews?.dislikedBy ?? [];
  //   const inArray = (e, arr) => Array.isArray(arr) && likedBy.includes(e);
  //   if (inArray(currentUserId, likedBy)) return "UP";
  //   if (inArray(currentUserId, dislikedBy)) return "DOWN";

  //   return null;
  // };

  const getReviewSpecs = (el) => {
    const likedBy = el?.reviews?.guestReviews?.likedBy ?? [];
    const dislikedBy = el?.reviews?.guestReviews?.dislikedBy ?? [];

    const likes = Array.isArray(likedBy) ? likedBy.length : 0;
    const dislikes = Array.isArray(dislikedBy) ? dislikedBy.length : 0;

    const reviewsCount = likes + dislikes;

    const approvalRate =
      reviewsCount > 0 ? Math.round((likes / reviewsCount) * 100) : 0;

    return {
      reviewsCount,
      approvalRate,
    };
  };

  // console.log("useProjectFlow RENDER");
  // useWhyDidYouUpdate("useProjectFlow", {
  //   membersById,
  //   ...project,
  //   ...user,
  //   viewRole,
  //   ...members,
  // });

  // -------------------------
  // Queries
  // -------------------------
  const queryKeyNodes = useMemo(() => flowKeys.nodes(projectId), [projectId]);
  const queryKeyEdges = useMemo(() => flowKeys.edges(projectId), [projectId]);

  const nodesQuery = useQuery({
    queryKey: queryKeyNodes,
    queryFn: () => listProjectNodesApi(projectId),
    enabled: Boolean(projectId),
  });

  const edgesQuery = useQuery({
    queryKey: queryKeyEdges,
    queryFn: () => listProjectEdgesApi(projectId),
    enabled: Boolean(projectId),
  });

  const nodeModels = useMemo(() => {
    return (nodesQuery.data?.nodes || []).map(toNodeModel).filter(Boolean);
  }, [nodesQuery.data?.nodes]);

  const edgeModels = useMemo(() => {
    return (edgesQuery.data?.edges || []).map(toEdgeModel).filter(Boolean);
  }, [edgesQuery.data?.edges]);

  // -------------------------
  // Node meta (used by guest lock/connect policies)
  // -------------------------
  const nodeMetaById = useMemo(() => {
    const map = new Map();

    for (const n of nodeModels) {
      const reviews = n.reviews ?? {};

      const creatorId = reviews.creator ?? null;
      const abandoned = Boolean(reviews.abandoned);

      const ownerReview = reviews.ownerReview ?? null; // APPROVED | REJECTED | BASELINE | POSTPONED | null

      const guestReviews = reviews.guestReviews ?? {};
      const likedBy = Array.isArray(guestReviews.likedBy)
        ? guestReviews.likedBy
        : [];
      const dislikedBy = Array.isArray(guestReviews.dislikedBy)
        ? guestReviews.dislikedBy
        : [];

      const approvalRate = Number.isFinite(reviews.approvalRate)
        ? reviews.approvalRate
        : 0;
      const likesCount = Number.isFinite(reviews.likesCount)
        ? reviews.likesCount
        : likedBy.length;
      const dislikesCount = Number.isFinite(reviews.dislikesCount)
        ? reviews.dislikesCount
        : dislikedBy.length;

      map.set(n.id, {
        id: n.id,
        label: n.label ?? "",

        reviews: {
          creator: creatorId,
          abandoned,
          ownerReview,
          guestReviews: {
            likedBy,
            dislikedBy,
          },
          approvalRate,
          likesCount,
          dislikesCount,
        },
      });
    }

    return map;
  }, [nodeModels, projectAuthorId, currentUserId]);

  // -------------------------
  // Mutations: Node review
  // -------------------------
  // const upsertNodeReviewMut = useMutation({
  //   mutationFn: ({ nodeId, verdict }) =>
  //     upsertNodeReviewApi(projectId, nodeId, { verdict }),
  //   onSettled: () => qc.invalidateQueries({ queryKey: queryKeyNodes }),
  // });

  // const onNodeReview = useCallback(
  //   async (nodeId, verdictOrNull) => {
  //     await upsertNodeReviewMut.mutateAsync({ nodeId, verdict: verdictOrNull });
  //   },
  //   [upsertNodeReviewMut],
  // );

  // -------------------------
  // Mutations: Node owner decision
  // ------------------------
  const setNodeOwnerDecisionMut = useMutation({
    mutationFn: ({ nodeId, verdict }) =>
      setNodeOwnerDecisionApi(projectId, nodeId, { verdict }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyNodes }),
  });

  const onNodeDecision = useCallback(
    async (nodeId, verdictOrNull) => {
      await setNodeOwnerDecisionMut.mutateAsync({
        nodeId,
        verdict: verdictOrNull,
      });
    },
    [setNodeOwnerDecisionMut],
  );

  // -------------------------
  // Mutations: Node delete
  // -------------------------
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

  // -------------------------
  // Mutations: Node create
  // -------------------------
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

  // -------------------------
  // Mutations: Edge review (guest)
  // -------------------------
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

  // -------------------------
  // Mutations: Edge delete (guest only)
  // -------------------------
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

  // -------------------------
  // Mutations: Edge decide (owner only)
  // -------------------------
  const decideEdgeMut = useMutation({
    mutationFn: ({ edgeId, decision }) =>
      setEdgeOwnerDecisionApi(projectId, edgeId, { decision }),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeyEdges }),
  });

  const onEdgeDecide = useCallback(
    async (edgeId, decisionOrNull) => {
      // decisionOrNull: "ACCEPTED" | "REJECTED" | null (optional clear)
      if (decisionOrNull == null) return;
      await decideEdgeMut.mutateAsync({ edgeId, decision: decisionOrNull });
    },
    [decideEdgeMut],
  );

  // -------------------------
  // Mutations: Edge create (drag connect)
  // -------------------------
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
  // Build XYFlow nodes
  // -------------------------

  const flowNodes = useMemo(() => {
    // console.log("flowNodes - useMemo");
    const persisted = persistedPositionsRef.current || {};
    const prevPositionsById = new Map();

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
        currentUserId,
        perms,
        ui,
        handlers: {
          onReview: onNodeDecision,
          onDelete: onNodeDelete,
          // onDecide: null,
        },
      });

      return {
        id: n.id,
        type: "custom",
        position: pos,
        data: { ...data, creator: membersById[getCreator(n)]?.name || null,reviewSpecs: getReviewSpecs(n),
          isAbandoned: isAbandoned(n)},
        // data: {
        //   label: n.label,

        //   // currentUserId,

        //   reviews: n.reviews, // { creator, abandoned, ownerReview, guestReviews{likedBy,dislikedBy}, approvalRate, likesCount, dislikesCount }

        //   affinityBarColor: affinityBarColor(n),
        //   pillMeta: pillMeta(n),
        //   canReview: canReview(n),
        //   canDelete: canDelete(n),
        //   // onReview: viewRole === "guest" ? onNodeReview : null,
        //   onReview: onNodeDecision,
        //   onDelete: onNodeDelete,
        //   viewerVerdict: getViewerVerdict(n),
        //   // viewRole: viewRole,
        //   endorseStateName: CURR_ENDORSED_STATE,
        //   opposeStateName: CURR_OPPOSED_STATE,
        //   reviewSpecs: getReviewSpecs(n),
        //   isAbandoned: isAbandoned(n),
        //   creator: membersById[getCreator(n)]?.name || null,
        // },
      };
    });
  }, [
    nodeModels,
    gridPos,
    currentUserId,
    viewRole,
    // onNodeDecision,
    // onNodeDelete,
  ]);

  // const flowNodes = useMemo(() => {
  //   const persisted = persistedPositionsRef.current || {};
  //   const prevPositionsById = new Map(); // views can provide existing nodes state; here keep simple
  //   return (nodeModels || []).map((n, i) => {
  //     const pos = persisted[n.id] || prevPositionsById.get(n.id) || gridPos(i);

  //     return {
  //       id: n.id,
  //       type: "custom",
  //       position: pos,
  //       data: {
  //         label: n.label,

  //         ownerDecision: n.ownerDecision ?? "PENDING",
  //         projectAuthorId,

  //         creatorId: n.creatorId,
  //         creatorName: n.creatorName,
  //         creatorEmail: n.creatorEmail,

  //         currentUserId,

  //         reviews: n.reviews,
  //         myReviewVerdict: n.myReviewVerdict,

  //         onReview: viewRole === "guest" ? onNodeReview : null,
  //         onDelete: onNodeDelete,
  //       },
  //     };
  //   });
  // }, [
  //   nodeModels,
  //   gridPos,
  //   projectAuthorId,
  //   currentUserId,
  //   viewRole,
  //   onNodeReview,
  //   onNodeDelete,
  // ]);

  // -------------------------
  // Build XYFlow edges (marker/style + policy-driven data)
  // -------------------------
  // const flowEdges = useMemo(() => {
  //   return (edgeModels || [])
  //     .filter((e) => e.sourceId && e.targetId)
  //     .map((e) => {
  //       const ui = edgePolicy.getEdgeUiState({
  //         edge: e,
  //         projectAuthorId,
  //         currentUserId,
  //         nodeMetaById,
  //       });

  //       const perms = edgePolicy.getEdgePermissions({
  //         edge: e,
  //         projectAuthorId,
  //         currentUserId,
  //         nodeMetaById,
  //         viewRole,
  //       });

  //       const data = edgePolicy.buildEdgeDataProps({
  //         edge: e,
  //         projectAuthorId,
  //         currentUserId,
  //         perms,
  //         ui,
  //         handlers: {
  //           onReview: onEdgeReview,
  //           onDelete: onEdgeDelete,
  //           onDecide: onEdgeDecide,
  //         },
  //       });

  //       return {
  //         id: e.id,
  //         type: "custom",
  //         source: e.sourceId,
  //         target: e.targetId,

  //         markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  //         style: ui.dashed ? { strokeDasharray: "6 4" } : undefined,

  //         data,
  //       };
  //     });
  // }, [
  //   edgeModels,
  //   projectAuthorId,
  //   currentUserId,
  //   nodeMetaById,
  //   viewRole,
  //   onEdgeReview,
  //   onEdgeDelete,
  //   onEdgeDecide,
  // ]);

  // -------------------------
  // onConnect handler (role-aware)
  // -------------------------

  const flowEdges = useMemo(() => {
    return (edgeModels || [])
      .filter((e) => e.sourceId && e.targetId)
      .map((e) => {
        // console.log("flowEdge mapping", e)

        const ui = edgePolicy.getEdgeUiState({
          edge: e,
          currentUserId,
          projectAuthorId,
        });

        const perms = edgePolicy.getEdgePermissions({
          edge: e,
          currentUserId,
          projectAuthorId,
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

        // console.log("flowEdge mapping", ui, perms, data);

        return {
          id: e.id,
          type: "custom",
          source: e.sourceId,
          target: e.targetId,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },

          // înainte aveai ui.dashed; în noul ui nu mai există.
          // stroke-ul vine din ui.strokeColor:
          style: { stroke: ui.strokeColor },

          data,
        };
      });
  }, [
    edgeModels,
    currentUserId,
    projectAuthorId,
    nodeMetaById,
    onEdgeReview,
    onEdgeDelete,
    onEdgeDecide,
  ]);

  const onConnect = useCallback(
    async (connection, setEdges) => {
      console.log({ ...connection });

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

              // NEW model (Link)
              reviews: {
                creator: currentUserId,
                abandoned: false,
                ownerReview: null, // APPROVED | REJECTED | BASELINE | POSTPONED | null

                guestReviews: {
                  likedBy: [],
                  dislikedBy: [],
                },

                approvalRate: 0,
                likesCount: 0,
                dislikesCount: 0,
              },

              // actions
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
                    // keep NEW model from backend (creator/abandoned/ownerReview/likedBy/dislikedBy/etc)
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
      viewRole,
      currentUserId,
      onEdgeCreate,
      onEdgeDelete,
      onEdgeReview,
      onEdgeDecide,
      qc,
      queryKeyEdges,
    ],
  );

  // const onConnect = useCallback(
  //   async (connection, setEdges) => {

  //     console.log({...connection})
  //     const sourceId = connection?.source ?? null;
  //     const targetId = connection?.target ?? null;
  //     if (!sourceId || !targetId || sourceId === targetId) return;

  //     // Guest: enforce connect policy. Owner: allow (no guest-lock concept)
  //     // if (viewRole === "guest") {
  //     //   const ok = connectPolicy.canCreateEdgeBetween({
  //     //     sourceId,
  //     //     targetId,
  //     //     nodeMetaById,
  //     //   });
  //     //   if (!ok) return;
  //     // }

  //     const tempId = `tmp-${sourceId}-${targetId}-${Date.now()}`;

  //     // optimistic
  //     setEdges((eds) =>
  //       addEdge(
  //         {
  //           id: tempId,
  //           type: "custom",
  //           source: sourceId,
  //           target: targetId,
  //           markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  //           style: { strokeDasharray: "6 4" },
  //           data: {
  //             ownerDecision: "PENDING",
  //             projectAuthorId,

  //             creatorId: currentUserId,
  //             creatorName: user?.name ?? null,
  //             creatorEmail: user?.email ?? null,

  //             currentUserId,
  //             reviews: {
  //               positive: 0,
  //               negative: 0,
  //               total: 0,
  //               approvalRatePct: 0,
  //             },
  //             myReviewVerdict: null,

  //             edgeAutoDisliked: false,

  //             // guest can delete own pending edge; owner no delete
  //             onDelete: viewRole === "guest" ? onEdgeDelete : null,

  //             // guest reviews edges; owner decides edges (wired in CustomEdge later)
  //             onReview: viewRole === "guest" ? onEdgeReview : null,
  //             onDecide: viewRole === "owner" ? onEdgeDecide : null,
  //           },
  //         },
  //         eds,
  //       ),
  //     );

  //     try {
  //       const res = await onEdgeCreate({ sourceId, targetId });
  //       const created = toEdgeModel(res?.edge);

  //       if (!created?.id) {
  //         qc.invalidateQueries({ queryKey: queryKeyEdges });
  //         return;
  //       }

  //       setEdges((eds) =>
  //         eds.map((edge) =>
  //           edge.id === tempId
  //             ? {
  //                 ...edge,
  //                 id: created.id,
  //                 source: created.sourceId ?? sourceId,
  //                 target: created.targetId ?? targetId,
  //               }
  //             : edge,
  //         ),
  //       );
  //     } catch {
  //       setEdges((eds) => eds.filter((edge) => edge.id !== tempId));
  //     }
  //   },
  //   [
  //     viewRole,
  //     nodeMetaById,
  //     projectAuthorId,
  //     currentUserId,
  //     user?.name,
  //     user?.email,
  //     onEdgeCreate,
  //     onEdgeDelete,
  //     onEdgeReview,
  //     onEdgeDecide,
  //     qc,
  //     queryKeyEdges,
  //   ],
  // );

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
    (nodes) => {
      const next = {};
      for (const n of nodes || []) next[n.id] = n.position;
      persistedPositionsRef.current = next;
      saveNodePositions(currentUserId, projectId, next);
    },
    [currentUserId, projectId],
  );

  const onNodesChangeDevLog = useCallback((changes) => {
    setLoggedChanges((old) => [...changes, ...old].slice(0, 20));
  }, []);

  return {
    // state
    flowNodes,
    flowEdges,
    nodeMetaById,

    // queries flags
    isLoading: nodesQuery.isLoading,
    isError: nodesQuery.isError,

    // actions
    onNodeCreate,
    onConnect, // expects (connection, setEdges)
    onMoveEnd,

    // persistence + refs
    rfInstanceRef,
    applyViewportOnce,
    persistNodePositions,

    // dev
    loggedChanges,
    onNodesChangeDevLog,
  };
}
