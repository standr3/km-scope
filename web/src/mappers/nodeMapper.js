// src/mappers/nodeMapper.js

const emptyArr = () => [];

export function toNodeModel(apiNode) {
  if (!apiNode) return null;
  // console.log(apiNode)

  const creatorId = apiNode.creator_id ?? null;
  const abandoned = Boolean(apiNode.abandoned);

  const ownerReview = apiNode.owner_review ?? null; // APPROVED | REJECTED | BASELINE | POSTPONED | null

  const likedBy =
    apiNode.liked_by ?? apiNode.likedBy ?? apiNode.likedby ?? emptyArr();

  const dislikedBy =
    apiNode.disliked_by ??
    apiNode.dislikedBy ??
    apiNode.dislikedby ??
    emptyArr();

  const likesCount = Array.isArray(likedBy) ? likedBy.length : 0;
  const dislikesCount = Array.isArray(dislikedBy) ? dislikedBy.length : 0;

  const total = likesCount + dislikesCount;
  const approvalRate = total > 0 ? Math.round((likesCount / total) * 100) : 0;

  const res = {
    id: apiNode.id,
    label: apiNode.label ?? "",
    reviews: {
      creator: creatorId,
      abandoned,
      ownerReview,
      guestReviews: {
        likedBy: Array.isArray(likedBy) ? likedBy : [],
        dislikedBy: Array.isArray(dislikedBy) ? dislikedBy : [],
      },
      approvalRate,
      likesCount,
      dislikesCount,
    },
  };
  // console.log("toNodeModel ", res)

  return res;
}
