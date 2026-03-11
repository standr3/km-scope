// src/policies/connectPolicy.js

/**
 * Guest rule v1:
 * - block if any endpoint isInvalidForMe (rejected by owner OR disliked-by-me)
 * - allow only if both endpoints areValidForMe (baseline/accepted/mine/(pending+likedByMe))
 *
 * Owner:
 * - no endpoint invalidation by "dislikedByMe" (inexistent)
 * - (optional) still block if endpoint rejected-by-owner if you want; for now, allow and rely on owner decisions/locks
 */
export function canCreateEdgeBetween({ sourceId, targetId, nodeMetaById, viewRole }) {
  const a = nodeMetaById.get(sourceId);
  const b = nodeMetaById.get(targetId);
  if (!a || !b) return false;

  if (viewRole === 'owner') {
    // baseline endpoints are allowed; baseline edges still cannot be "decided" later (handled in edgePolicy)
    return true;
  }

  // guest
  if (a.isInvalidForMe || b.isInvalidForMe) return false;
  if (!a.isValidForMe || !b.isValidForMe) return false;

  return true;
}
