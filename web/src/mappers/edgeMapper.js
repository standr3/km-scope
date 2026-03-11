// src/mappers/edgeMapper.js

export function toEdgeModel(apiEdge) {
  if (!apiEdge) return null;

  const id = apiEdge.id;
  const sourceId = apiEdge.source_id;
  const targetId = apiEdge.target_id;

  const creator = apiEdge.creator_id;
  const abandoned = apiEdge.abandoned;
  const ownerReview = apiEdge.owner_review; // APPROVED | REJECTED | BASELINE | POSTPONED | null

  const likedBy = apiEdge.liked_by;
  const dislikedBy = apiEdge.disliked_by;
  const likesCount = likedBy.length;
  const dislikesCount = dislikedBy.length;
  const total = likesCount + dislikesCount;

  const approvalRate = total > 0 ? likesCount / total : 0;

  const res = {
    id,
    sourceId,
    targetId,
    reviews: {
      creator,
      abandoned,
      ownerReview,
      guestReviews: {
        likedBy,
        dislikedBy,
      },
      likesCount,
      dislikesCount,
      approvalRate,
    },
  };
  // console.log(res);

  return res;
}
