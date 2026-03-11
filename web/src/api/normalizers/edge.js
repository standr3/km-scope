function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

function normalizeReviews(r) {
  const reviews = r || {};
  const positive = Number(pick(reviews, "positive")) || 0;
  const negative = Number(pick(reviews, "negative")) || 0;
  const total = Number(pick(reviews, "total")) || positive + negative;
  const approvalRatePct =
    Number(pick(reviews, "approvalRatePct", "approval_rate_pct")) ||
    (total ? Math.round((positive / total) * 100) : 0);

  return { positive, negative, total, approvalRatePct };
}

export function normalizeEdge(dto) {
  if (!dto) return null;

  const creator = dto.creator || null;

  return {
    id: pick(dto, "id"),
    projectId: pick(dto, "projectId", "project_id"),

    sourceId: pick(dto, "sourceId", "source_id", "source"),
    targetId: pick(dto, "targetId", "target_id", "target"),

    ownerDecision: pick(dto, "ownerDecision", "owner_decision") || "PENDING",

    creatorId: pick(creator, "id") ?? pick(dto, "creatorId", "creator_id"),
    creatorName:
      pick(creator, "name") ?? pick(dto, "creatorName", "creator_name"),
    creatorEmail:
      pick(creator, "email") ?? pick(dto, "creatorEmail", "creator_email"),

    myReviewVerdict: pick(dto, "myReviewVerdict", "my_review_verdict"),

    reviews: normalizeReviews(dto.reviews),
  };
}
