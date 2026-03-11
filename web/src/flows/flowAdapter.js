// src/flows/flowAdapter.js
import { toNodeModel } from '../mappers/nodeMapper';
import { toEdgeModel } from '../mappers/edgeMapper';

const DEFAULT_REVIEWS = { positive: 0, negative: 0, total: 0, approvalRatePct: 0 };

/**
 * Normalizes models into XYFlow shape (nodes/edges arrays)
 * by injecting "data" props expected by CustomNode/CustomEdge.
 *
 * Keep this file "pure": only mapping, no react-query, no mutations.
 */

export function toFlowNodes({
  nodeModels,
  projectAuthorId,
  currentUserId,
  handlers,
  persistedPositions,
  prevPositionsById,
  gridPos,
}) {
  const list = (nodeModels || []).map(toNodeModel).filter(Boolean);

  return list.map((n, i) => {
    const position =
      (persistedPositions && persistedPositions[n.id]) ||
      (prevPositionsById && prevPositionsById.get(n.id)) ||
      (gridPos ? gridPos(i) : { x: 0, y: 0 });

    return {
      id: n.id,
      type: 'custom',
      position,
      data: {
        label: n.label,

        ownerDecision: n.ownerDecision ?? 'PENDING',
        projectAuthorId: projectAuthorId ?? null,

        creatorId: n.creatorId ?? null,
        creatorName: n.creatorName ?? null,
        creatorEmail: n.creatorEmail ?? null,

        currentUserId: currentUserId ?? null,

        reviews: n.reviews ? { ...DEFAULT_REVIEWS, ...n.reviews } : DEFAULT_REVIEWS,
        myReviewVerdict: n.myReviewVerdict ?? null,

        onReview: handlers?.onNodeReview ?? null,
        onDelete: handlers?.onNodeDelete ?? null,

        // optional: for future node owner-decision
        onDecide: handlers?.onNodeDecide ?? null,
      },
    };
  });
}

export function toFlowEdges({
  edgeModels,
  projectAuthorId,
  currentUserId,
  nodeMetaById, // optional; policies may need it in view hook instead
  edgePolicy,   // injected helpers that compute ui/perms/data (keeps adapter dumb-ish)
  handlers,
}) {
  const list = (edgeModels || []).map(toEdgeModel).filter(Boolean);

  return list
    .filter((e) => e.sourceId && e.targetId)
    .map((e) => {
      // If you want adapter fully dumb, you can compute ui/perms in the hook and pass ready "data".
      // Here we allow injected edgePolicy to build consistent data.
      const ui = edgePolicy?.getEdgeUiState
        ? edgePolicy.getEdgeUiState({ edge: e, projectAuthorId, currentUserId, nodeMetaById })
        : { dashed: e.ownerDecision === 'PENDING', locked: Boolean(e.edgeAutoDisliked), uiState: 'pending' };

      const perms = edgePolicy?.getEdgePermissions
        ? edgePolicy.getEdgePermissions({
            edge: e,
            projectAuthorId,
            currentUserId,
            nodeMetaById,
            viewRole: edgePolicy.viewRole,
          })
        : { canReview: false, canDelete: false, canDecide: false, locked: Boolean(ui.locked) };

      const data = edgePolicy?.buildEdgeDataProps
        ? edgePolicy.buildEdgeDataProps({
            edge: e,
            projectAuthorId,
            currentUserId,
            perms,
            ui,
            handlers: {
              onReview: handlers?.onEdgeReview,
              onDelete: handlers?.onEdgeDelete,
              onDecide: handlers?.onEdgeDecide,
            },
          })
        : {
            ownerDecision: e.ownerDecision ?? 'PENDING',
            projectAuthorId,
            creatorId: e.creatorId ?? null,
            creatorName: e.creatorName ?? null,
            creatorEmail: e.creatorEmail ?? null,
            currentUserId,
            reviews: e.reviews ?? DEFAULT_REVIEWS,
            myReviewVerdict: e.myReviewVerdict ?? null,
            edgeAutoDisliked: Boolean(ui.locked),
            onReview: perms.canReview ? handlers?.onEdgeReview : null,
            onDelete: perms.canDelete ? handlers?.onEdgeDelete : null,
            onDecide: perms.canDecide ? handlers?.onEdgeDecide : null,
          };

      return {
        id: e.id,
        type: 'custom',
        source: e.sourceId,
        target: e.targetId,
        // markerEnd / style set in view hook (so role can decide)
        data,
      };
    });
}
