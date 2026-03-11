function deriveNodeContext({ node, currentUserId, projectAuthorId }) {
  const reviews = node?.reviews ?? {};
  const guestReviews = reviews.guestReviews ?? {};

  const creatorId = reviews.creator ?? null;
  const abandoned = Boolean(reviews.abandoned);

  const ownerReview = reviews.ownerReview ?? null; // "APPROVED" | "REJECTED" | null
  // console.log("deriveNodeContext-ownerReview",ownerReview)
  // console.log(currentUserId, projectAuthorId)
  const viewRole = currentUserId === projectAuthorId ? "owner" : "guest";

  const isOwnerCreated = creatorId != null && creatorId === projectAuthorId; // "Owner created"
  const isViewerCreated = creatorId != null && creatorId === currentUserId; // "GuestX created" (pentru guestX)

  const likedBy = Array.isArray(guestReviews.likedBy)
    ? guestReviews.likedBy
    : [];
  const dislikedBy = Array.isArray(guestReviews.dislikedBy)
    ? guestReviews.dislikedBy
    : [];

  const viewerLiked = likedBy.includes(currentUserId);
  const viewerDisliked = dislikedBy.includes(currentUserId);

  const viewerVote = viewerLiked ? "up" : viewerDisliked ? "down" : null;

  return {
    viewRole,
    creatorId,
    abandoned,
    ownerReview,
    isOwnerCreated,
    isViewerCreated,
    viewerLiked,
    viewerDisliked,
    viewerVote,
  };
}

/**
 * PERMISSIONS (policy)
 * - canDelete / canReview / canDecide (scalabil)
 */
export function getNodePermissions({ node, currentUserId, projectAuthorId }) {
  // console.log("ctx- getNodePermissions ", currentUserId, projectAuthorId)
  const ctx = deriveNodeContext({ node, currentUserId, projectAuthorId });

  // "ca sa fie considerat creator" (din regulile tale)
  const isCreator =
    ctx.viewRole === "owner"
      ? ctx.isOwnerCreated
      : ctx.isViewerCreated && !ctx.abandoned;

  // Din spreadsheet:
  // - Owner: poate review pe nodes create de guests (indiferent abandoned), nu pe ale lui.
  const canOwnerReview = ctx.viewRole === "owner" && !ctx.isOwnerCreated;

  // - Guest: poate review doar dacă NU e node creat de owner, și owner nu a decis încă,
  //          și NU e propria creație "active" (not abandoned) (acolo canReview=false).
  const canGuestReview =
    ctx.viewRole === "guest" &&
    !ctx.isOwnerCreated &&
    ctx.ownerReview == null &&
    !(ctx.isViewerCreated && !ctx.abandoned);

  // Din spreadsheet:
  // - Owner: canDelete doar pe node-urile lui (Owner created)
  // - Guest: canDelete doar pe node-urile lui dacă nu e abandoned și ownerReview e null
  const canDelete =
    ctx.viewRole === "owner"
      ? ctx.isOwnerCreated
      : ctx.isViewerCreated && !ctx.abandoned && ctx.ownerReview == null;

  return {
    isCreator,
    canDelete,
    canReview: ctx.viewRole === "owner" ? canOwnerReview : canGuestReview,
    // canDecide: false, // las aici pt extensie; nu e definit în cazurile curente
  };
}

/**
 * UI (presentation)
 * Returnează exact ce vrei să ajungă în data props:
 * - affinityBarColor
 * - pillColor
 * - pillText
 * - lastReview
 */
export function getNodeUiState({ node, currentUserId, projectAuthorId }) {
  const ctx = deriveNodeContext({ node, currentUserId, projectAuthorId });

  // lastReview:
  // - Owner view: reflectă ownerReview (up/down/null) conform spreadsheet
  // - Guest view: reflectă votul viewerului (liked/disliked/null)
  const lastReview =
    ctx.viewRole === "owner"
      ? ctx.ownerReview === "APPROVED"
        ? "up"
        : ctx.ownerReview === "REJECTED"
          ? "down"
          : null
      : ctx.viewerVote;

  // Helper pentru pill în funcție de ownerReview
  const pillByOwnerReview =
    ctx.ownerReview === "APPROVED"
      ? { pillColor: "green", pillText: "Approved" }
      : ctx.ownerReview === "REJECTED"
        ? { pillColor: "red", pillText: "Rejected" }
        : null; // ownerReview == null

  // console.log("getNodeUiState", lastReview, pillByOwnerReview)
  // OWNER VIEW (din spreadsheet)
  if (ctx.viewRole === "owner") {
    if (ctx.isOwnerCreated) {
      return {
        affinityBarColor: "black",
        pillColor: "gray",
        pillText: "Baseline",
        lastReview: null,
      };
    }

    // node creat de guest: Pending/Approved/Rejected
    if (pillByOwnerReview) {
      return {
        affinityBarColor: pillByOwnerReview.pillColor, // green/red
        pillColor: pillByOwnerReview.pillColor,
        pillText: pillByOwnerReview.pillText,
        lastReview,
      };
    }

    return {
      affinityBarColor: "orange",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: null,
    };
  }

  // GUEST VIEW (din spreadsheet)
  // 1) Owner created
  if (ctx.isOwnerCreated) {
    return {
      affinityBarColor: "gray",
      pillColor: "gray",
      pillText: "Baseline",
      lastReview: null,
    };
  }

  // 2) Owner decided (Approved/Rejected)
  if (pillByOwnerReview) {
    // ACCEPTED:
    // - black dacă viewerLiked OR (viewer e creator și nu e abandoned)
    // - altfel gray
    if (ctx.ownerReview === "APPROVED") {
      const affinityBarColor =
        ctx.viewerLiked || (ctx.isViewerCreated && !ctx.abandoned)
          ? "black"
          : "gray";

      return {
        affinityBarColor,
        pillColor: "green",
        pillText: "Approved",
        lastReview,
      };
    }

    // REJECTED: stroke red mereu
    return {
      affinityBarColor: "red",
      pillColor: "red",
      pillText: "Rejected",
      lastReview,
    };
  }

  // 3) ownerReview == null (Pending / Needs Review)
  // - propriul node, not abandoned => Pending black, canReview=false (permissions), canDelete=true (permissions)
  // - dacă a votat: Pending (pill), stroke black (up) / red (down)
  // - dacă nu a votat: Needs Review, stroke orange
  if (ctx.isViewerCreated && !ctx.abandoned) {
    return {
      affinityBarColor: "black",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: null,
    };
  }

  if (ctx.viewerLiked) {
    return {
      affinityBarColor: "black",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: "up",
    };
  }

  if (ctx.viewerDisliked) {
    return {
      affinityBarColor: "red",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: "down",
    };
  }

  return {
    affinityBarColor: "orange",
    pillColor: "orange",
    pillText: "Needs Review",
    lastReview: null,
  };
}

/**
 * DATA PROPS: doar “wiring”
 * (ui-ul nu “pleacă din perms”, dar perms influențează ce handlers expui)
 */
export function buildNodeDataProps({
  node,
  creator=null,
  currentUserId,
  perms,
  ui,
  handlers,
}) {
  // console.log(creator);
//   {
//     "id": "f0a4d55c-632f-4811-b578-7b129dc5b239",
//     "label": "sad",
//     "reviews": {
//         "creator": "900cb8ec-caa2-4f77-9be6-7718fcb14adf",
//         "abandoned": false,
//         "ownerReview": "BASELINE",
//         "guestReviews": {
//             "likedBy": [],
//             "dislikedBy": []
//         },
//         "approvalRate": 0,
//         "likesCount": 0,
//         "dislikesCount": 0
//     }
// }

// {
//     "name": "tests1",
//     "role": "STUDENT"
// }

  // console.log("buildNodeDataProps with ownerReview", node.reviews.ownerReview)

  return {
    id: node.id,
    label:node.label,
    creatorId: creator?.id,
    creatorName: creator?.name,
    abandoned: node.reviews.abandoned,
    ownerReview: node.reviews.ownerReview,
    likedBy: node.reviews.guestReviews.likedBy,
    dislikedBy: node.reviews.guestReviews.dislikedBy,
    likesCount:node.reviews.likesCount,
    dislikesCount:node.reviews.dislikesCount,
    approvalRate:node.reviews.approvalRate,

    currentUserId,
    // label: node.label,
    affinityBarColor: ui.affinityBarColor,
    pillColor: ui.pillColor,
    pillText: ui.pillText,
    lastReview: ui.lastReview,

    canDelete: perms.canDelete,
    canReview: perms.canReview,
    // canDecide: perms.canDecide,

    onReview: perms.canReview ? handlers?.onReview : null,
    onDelete: perms.canDelete ? handlers?.onDelete : null,
    // onDecide: perms.canDecide ? handlers?.onDecide : null,
  };
}
