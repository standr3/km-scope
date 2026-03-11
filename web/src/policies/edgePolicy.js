function deriveEdgeContext({ edge, currentUserId, projectAuthorId }) {
  const reviews = edge?.reviews ?? {};
  const guestReviews = reviews.guestReviews ?? {};

  const creatorId = reviews.creator ?? null;
  const abandoned = Boolean(reviews.abandoned);
  const ownerReview = reviews.ownerReview ?? null; // "APPROVED" | "REJECTED" | null

  // console.log(currentUserId, projectAuthorId)
  const viewRole = currentUserId === projectAuthorId ? "owner" : "guest";

  const isOwnerCreated = creatorId != null && creatorId === projectAuthorId; // "Owner created"
  const isViewerCreated = creatorId != null && creatorId === currentUserId; // "GuestX created" (pentru guestX)

  const likedBy = Array.isArray(guestReviews.likedBy) ? guestReviews.likedBy : [];
  const dislikedBy = Array.isArray(guestReviews.dislikedBy) ? guestReviews.dislikedBy : [];

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
export function getEdgePermissions({ edge, currentUserId, projectAuthorId }) {
  // console.log("ctx- getEdgePermissions ", currentUserId, projectAuthorId)
  const ctx = deriveEdgeContext({ edge, currentUserId, projectAuthorId });

  // "ca sa fie considerat creator" (din regulile tale)
  const isCreator =
    ctx.viewRole === "owner"
      ? ctx.isOwnerCreated
      : ctx.isViewerCreated && !ctx.abandoned;

  // Din spreadsheet:
  // - Owner: poate review pe edges create de guests (indiferent abandoned), nu pe ale lui.
  const canOwnerReview = ctx.viewRole === "owner" && !ctx.isOwnerCreated;

  // - Guest: poate review doar dacă NU e edge creat de owner, și owner nu a decis încă,
  //          și NU e propria creație "active" (not abandoned) (acolo canReview=false).
  const canGuestReview =
    ctx.viewRole === "guest" &&
    !ctx.isOwnerCreated &&
    ctx.ownerReview == null &&
    !(ctx.isViewerCreated && !ctx.abandoned);

  // Din spreadsheet:
  // - Owner: canDelete doar pe edge-urile lui (Owner created)
  // - Guest: canDelete doar pe edge-urile lui dacă nu e abandoned și ownerReview e null
  const canDelete =
    ctx.viewRole === "owner"
      ? ctx.isOwnerCreated
      : ctx.isViewerCreated && !ctx.abandoned && ctx.ownerReview == null;

  return {
    isCreator,
    canDelete,
    canReview: ctx.viewRole === "owner" ? canOwnerReview : canGuestReview,
    canDecide: false, // las aici pt extensie; nu e definit în cazurile curente
  };
}

/**
 * UI (presentation)
 * Returnează exact ce vrei să ajungă în data props:
 * - strokeColor
 * - pillColor
 * - pillText
 * - lastReview
 */
export function getEdgeUiState({ edge, currentUserId, projectAuthorId }) {
  const ctx = deriveEdgeContext({ edge, currentUserId, projectAuthorId });

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

  // OWNER VIEW (din spreadsheet)
  if (ctx.viewRole === "owner") {
    if (ctx.isOwnerCreated) {
      return {
        strokeColor: "black",
        pillColor: "gray",
        pillText: "Baseline",
        lastReview: null,
      };
    }

    // Edge creat de guest: Pending/Approved/Rejected
    if (pillByOwnerReview) {
      return {
        strokeColor: pillByOwnerReview.pillColor, // green/red
        pillColor: pillByOwnerReview.pillColor,
        pillText: pillByOwnerReview.pillText,
        lastReview,
      };
    }

    return {
      strokeColor: "orange",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: null,
    };
  }

  // GUEST VIEW (din spreadsheet)
  // 1) Owner created
  if (ctx.isOwnerCreated) {
    return {
      strokeColor: "gray",
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
      const strokeColor =
        ctx.viewerLiked || (ctx.isViewerCreated && !ctx.abandoned) ? "black" : "gray";

      return {
        strokeColor,
        pillColor: "green",
        pillText: "Approved",
        lastReview,
      };
    }

    // REJECTED: stroke red mereu
    return {
      strokeColor: "red",
      pillColor: "red",
      pillText: "Rejected",
      lastReview,
    };
  }

  // 3) ownerReview == null (Pending / Needs Review)
  // - propriul edge, not abandoned => Pending black, canReview=false (permissions), canDelete=true (permissions)
  // - dacă a votat: Pending (pill), stroke black (up) / red (down)
  // - dacă nu a votat: Needs Review, stroke orange
  if (ctx.isViewerCreated && !ctx.abandoned) {
    return {
      strokeColor: "black",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: null,
    };
  }

  if (ctx.viewerLiked) {
    return {
      strokeColor: "black",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: "up",
    };
  }

  if (ctx.viewerDisliked) {
    return {
      strokeColor: "red",
      pillColor: "orange",
      pillText: "Pending",
      lastReview: "down",
    };
  }

  return {
    strokeColor: "orange",
    pillColor: "orange",
    pillText: "Needs Review",
    lastReview: null,
  };
}

/**
 * DATA PROPS: doar “wiring”
 * (ui-ul nu “pleacă din perms”, dar perms influențează ce handlers expui)
 */
export function buildEdgeDataProps({ edge, currentUserId, perms, ui, handlers }) {

  return {
    currentUserId,

    strokeColor: ui.strokeColor,
    pillColor: ui.pillColor,
    pillText: ui.pillText,
    lastReview: ui.lastReview,

    canDelete: perms.canDelete,
    canReview: perms.canReview,
    canDecide: perms.canDecide,

    onReview: perms.canReview ? handlers?.onReview : null,
    onDelete: perms.canDelete ? handlers?.onDelete : null,
    onDecide: perms.canDecide ? handlers?.onDecide : null,
  };
}