// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// Funcții pure — nu ating Yjs, nu importă React
// Primesc events ca array JS simplu, returnează resolution
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// EVENT FORMAT
// {
//   id: string,
//   createdAt: number,
//   entityType: "node" | "edge",
//   entityId: string,
//   action: "create" | "up" | "down" | "abandon",
//   scope: "local" | "global",
//   userId: string | null,       // null pentru owner (scope global)
//   sourceId?: string,           // doar pentru edge
//   targetId?: string,           // doar pentru edge
// }
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// RESOLUTION FORMAT
// {
//   error: string | null,
//   requiresConfirm: { message: string } | null,
//   entities: {
//     nodes: { add: [nodeObj], remove: [nodeId] },
//     edges: { add: [edgeObj], remove: [edgeId] },
//   },
//   events: {
//     nodes: { add: [eventData], remove: [eventId] },
//     edges: { add: [eventData], remove: [eventId] },
//   },
// }
// ─────────────────────────────────────────────────────────────────────────────

export const createEvent = (data) => ({
  id: crypto.randomUUID(),
  createdAt: Date.now(),
  ...data,
});

export const createEmptyResolution = () => ({
  error: null,
  requiresConfirm: null,
  entities: {
    nodes: { add: [], remove: [] },
    edges: { add: [], remove: [] },
  },
  events: {
    nodes: { add: [], remove: [] },
    edges: { add: [], remove: [] },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Găsește event de review pentru un actor pe o entitate
export function findReviewEvent(events, { entityId, actorRole, actorId }) {
  return events.find(
    (e) =>
      e.entityId === entityId &&
      (e.action === "up" || e.action === "down") &&
      (actorRole === "OWNER"
        ? e.scope === "global" && e.userId === null
        : e.scope === "local" && e.userId === actorId),
  );
}

// Găsește event de tip specific pe un nod
export function findNodeEvent(events, { nodeId, action, scope, userId }) {
  return events.find((e) => {
    if (e.entityType !== "node") return false;
    if (e.entityId !== nodeId) return false;
    if (e.action !== action) return false;
    if (e.scope !== scope) return false;
    if (scope === "local") return e.userId === userId;
    return true;
  });
}

// adevarat(entitate, actor) conform modelului distribuit:
// owner a creat sau aprobat → adevărat pentru toți
// actorul e creator sau a dat up → adevărat pentru el
export function isEntityTrueForActor(entityEvents, { actorId }) {
  const ownerCreated = entityEvents.some(
    (e) => e.action === "create" && e.scope === "global",
  );
  const ownerUpped = entityEvents.some(
    (e) => e.action === "up" && e.scope === "global",
  );
  const actorCreated = entityEvents.some(
    (e) => e.action === "create" && e.userId === actorId,
  );
  const actorUpped = entityEvents.some(
    (e) => e.action === "up" && e.userId === actorId,
  );
  return ownerCreated || ownerUpped || actorCreated || actorUpped;
}

// Toate edge events adiacente unui nod (bazat pe sourceId/targetId)
export function getAdjacentEdgeEvents(events, nodeId) {
  // găsim edgeIds care au nodul ca capăt din create events
  const adjacentEdgeIds = new Set(
    events
      .filter(
        (e) =>
          e.entityType === "edge" &&
          e.action === "create" &&
          (e.sourceId === nodeId || e.targetId === nodeId),
      )
      .map((e) => e.entityId),
  );

  // returnăm TOATE events pentru acele edgeIds
  return events.filter(
    (e) => e.entityType === "edge" && adjacentEdgeIds.has(e.entityId),
  );
}

// EdgeIds unice dintr-un array de edge events
export function getUniqueEdgeIds(edgeEvents) {
  return [...new Set(edgeEvents.map((e) => e.entityId))];
}

// Verifică dacă un nod abandonat fără reviews trebuie șters
// Returnează true dacă nodul trebuie șters
export function shouldDeleteAbandonedNode(nodeId, events, removedEventId) {
  const nodeEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === nodeId,
  );
  const isAbandoned = nodeEvents.some((e) => e.action === "abandon");
  const remainingReviews = nodeEvents.filter(
    (e) =>
      (e.action === "up" || e.action === "down") && e.id !== removedEventId,
  );
  return isAbandoned && remainingReviews.length === 0;
}

// Adaugă în resolution ștergerea unui nod abandonat și a edges adiacente goale
export function addAbandonedNodeCleanup(res, nodeId, events) {
  const nodeEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === nodeId,
  );
  res.entities.nodes.remove.push(nodeId);
  res.events.nodes.remove.push(...nodeEvents.map((e) => e.id));

  const edgeEvents = getAdjacentEdgeEvents(events, nodeId);
  for (const edgeId of getUniqueEdgeIds(edgeEvents)) {
    const edgeEventsForId = edgeEvents.filter((e) => e.entityId === edgeId);
    const edgeAbandoned = edgeEventsForId.some((e) => e.action === "abandon");
    const edgeReviews = edgeEventsForId.filter(
      (e) => e.action === "up" || e.action === "down",
    );
    if (edgeAbandoned && edgeReviews.length === 0) {
      res.entities.edges.remove.push(edgeId);
      res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW STATE
// ─────────────────────────────────────────────────────────────────────────────

export function getNodeReviewState(
  nodeId,
  events,
  { currentMemberId, currentMemberRole, projectOwnerId, getMemberById },
) {
  const nodeEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === nodeId,
  );

  const ownerCreated = nodeEvents.some(
    (e) => e.action === "create" && e.scope === "global",
  );
  const ownerUpped = nodeEvents.some(
    (e) => e.action === "up" && e.scope === "global",
  );
  const ownerDowned = nodeEvents.some(
    (e) => e.action === "down" && e.scope === "global",
  );

  const currentCreated =
    currentMemberRole === "OWNER"
      ? ownerCreated
      : nodeEvents.some(
          (e) => e.action === "create" && e.userId === currentMemberId,
        );

  const currentAbandoned =
    currentMemberRole === "OWNER"
      ? false
      : nodeEvents.some(
          (e) => e.action === "abandon" && e.userId === currentMemberId,
        );

  const currentUpped =
    currentMemberRole === "OWNER"
      ? ownerUpped
      : nodeEvents.some(
          (e) => e.action === "up" && e.userId === currentMemberId,
        );

  const currentDowned =
    currentMemberRole === "OWNER"
      ? ownerDowned
      : nodeEvents.some(
          (e) => e.action === "down" && e.userId === currentMemberId,
        );

  const upCount = nodeEvents.filter(
    (e) => e.action === "up" && e.scope === "local",
  ).length;
  const downCount = nodeEvents.filter(
    (e) => e.action === "down" && e.scope === "local",
  ).length;

  const ownerBlocked = ownerCreated || ownerUpped || ownerDowned;
  let reviewable = true;
  let canReview = false;

  if (ownerCreated || currentCreated || currentAbandoned) {
    reviewable = false;
  } else {
    canReview = !ownerBlocked;
  }

  const canDelete =
    currentMemberRole === "OWNER" ||
    (currentCreated && !ownerUpped && !ownerDowned);

  const creatorId = ownerCreated
    ? projectOwnerId
    : (nodeEvents.find((e) => e.action === "create" && e.scope === "local")
        ?.userId ?? "creator_id_missing");

  const dbgName = (userId, name) => {
    if (userId === projectOwnerId) return "o";
    if (name === "tests1") return "1";
    if (name === "tests2") return "2";
    return "_";
  };

  const creatorName = dbgName(
    creatorId,
    getMemberById(creatorId)?.name ?? "creator_name_missing",
  );

  const usersNameUppedArray = nodeEvents
    .filter((e) => e.action === "up")
    .map((e) =>
      dbgName(e.userId ?? projectOwnerId, getMemberById(e.userId)?.name ?? ""),
    );

  const usersNameDownedArray = nodeEvents
    .filter((e) => e.action === "down")
    .map((e) =>
      dbgName(e.userId ?? projectOwnerId, getMemberById(e.userId)?.name ?? ""),
    );

  return {
    ownerCreated,
    ownerUpped,
    ownerDowned,
    ownerReviewed: ownerUpped || ownerDowned,
    currentCreated,
    currentAbandoned,
    currentUpped,
    currentDowned,
    currentReviewed: currentUpped || currentDowned,
    upCount,
    downCount,
    reviewable,
    canReview,
    canDelete,
    creatorId,
    creatorName,
    usersNameUppedArray,
    usersNameDownedArray,
  };
}

export function getEdgeReviewState(
  edgeId,
  events,
  { currentMemberId, currentMemberRole, projectOwnerId, getMemberById },
) {
  const edgeEvents = events.filter(
    (e) => e.entityType === "edge" && e.entityId === edgeId,
  );

  const ownerCreated = edgeEvents.some(
    (e) => e.action === "create" && e.scope === "global",
  );
  const ownerUpped = edgeEvents.some(
    (e) => e.action === "up" && e.scope === "global",
  );
  const ownerDowned = edgeEvents.some(
    (e) => e.action === "down" && e.scope === "global",
  );

  const currentCreated =
    currentMemberRole === "OWNER"
      ? ownerCreated
      : edgeEvents.some(
          (e) => e.action === "create" && e.userId === currentMemberId,
        );

  const currentAbandoned =
    currentMemberRole === "OWNER"
      ? false
      : edgeEvents.some(
          (e) => e.action === "abandon" && e.userId === currentMemberId,
        );

  const currentUpped =
    currentMemberRole === "OWNER"
      ? ownerUpped
      : edgeEvents.some(
          (e) => e.action === "up" && e.userId === currentMemberId,
        );

  const currentDowned =
    currentMemberRole === "OWNER"
      ? ownerDowned
      : edgeEvents.some(
          (e) => e.action === "down" && e.userId === currentMemberId,
        );

  const upCount = edgeEvents.filter(
    (e) => e.action === "up" && e.scope === "local",
  ).length;
  const downCount = edgeEvents.filter(
    (e) => e.action === "down" && e.scope === "local",
  ).length;

  const ownerBlocked = ownerCreated || ownerUpped || ownerDowned;
  let reviewable = true;
  let canReview = false;

  if (ownerCreated || currentCreated || currentAbandoned) {
    reviewable = false;
  } else {
    canReview = !ownerBlocked;
  }

  const canDelete =
    currentMemberRole === "OWNER" ||
    (currentCreated && !ownerUpped && !ownerDowned);

  const creatorId = ownerCreated
    ? projectOwnerId
    : (edgeEvents.find((e) => e.action === "create" && e.scope === "local")
        ?.userId ?? "creator_id_missing");

  const dbgName = (userId, name) => {
    if (userId === projectOwnerId) return "o";
    if (name === "tests1") return "1";
    if (name === "tests2") return "2";
    return "_";
  };

  const creatorName = dbgName(
    creatorId,
    getMemberById(creatorId)?.name ?? "creator_name_missing",
  );

  const usersNameUppedArray = edgeEvents
    .filter((e) => e.action === "up")
    .map((e) =>
      dbgName(e.userId ?? projectOwnerId, getMemberById(e.userId)?.name ?? ""),
    );

  const usersNameDownedArray = edgeEvents
    .filter((e) => e.action === "down")
    .map((e) =>
      dbgName(e.userId ?? projectOwnerId, getMemberById(e.userId)?.name ?? ""),
    );

  return {
    ownerCreated,
    ownerUpped,
    ownerDowned,
    ownerReviewed: ownerUpped || ownerDowned,
    currentCreated,
    currentAbandoned,
    currentUpped,
    currentDowned,
    currentReviewed: currentUpped || currentDowned,
    upCount,
    downCount,
    reviewable,
    canReview,
    canDelete,
    creatorId,
    creatorName,
    usersNameUppedArray,
    usersNameDownedArray,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE ACTION — entry point
// ─────────────────────────────────────────────────────────────────────────────

export function resolveAction(action, context) {
  switch (action.type) {
    case "NODE_ADD":
      return resolveNodeAdd(action, context);
    case "NODE_DELETE":
      return resolveNodeDelete(action.nodeId, context);
    case "NODE_VOTE":
      return resolveNodeVote(action, context);
    case "EDGE_CREATE":
      return resolveEdgeCreate(action, context);
    case "EDGE_DELETE":
      return resolveEdgeDelete(action, context);
    case "EDGE_VOTE":
      return resolveEdgeVote(action, context);
    default:
      return { ...createEmptyResolution(), error: "Unknown action type" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

export function resolveNodeAdd(
  action,
  { currentMemberId, currentMemberRole, nodes },
) {
  const res = createEmptyResolution();
  const scope = currentMemberRole === "OWNER" ? "global" : "local";
  const nodeId = crypto.randomUUID();

  if (action.label) {
    const labelExists = nodes.some((n) => n.data?.label === action.label);
    if (labelExists) {
      res.error = "A node with this label already exists";
      return res;
    }
  }

  res.entities.nodes.add.push({
    id: nodeId,
    type: "custom",
    position: action.position ?? { x: 0, y: 0 },
    data: { createdBy: currentMemberId, label: action.label ?? "" },
  });

  res.events.nodes.add.push({
    entityType: "node",
    entityId: nodeId,
    action: "create",
    scope,
    userId: scope === "local" ? currentMemberId : null,
  });

  return res;
}

export function resolveNodeDelete(
  nodeId,
  { events, currentMemberId, currentMemberRole },
) {
  const res = createEmptyResolution();

  const nodeEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === nodeId,
  );
  const edgeEvents = getAdjacentEdgeEvents(events, nodeId);
  const affectedEdgeIds = getUniqueEdgeIds(edgeEvents);

  // ─── OWNER ───────────────────────────────────────────────────────────────
  if (currentMemberRole === "OWNER") {
    res.entities.nodes.remove.push(nodeId);
    res.events.nodes.remove.push(...nodeEvents.map((e) => e.id));
    res.entities.edges.remove.push(...affectedEdgeIds);
    res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
    return res;
  }

  // ─── GUEST ────────────────────────────────────────────────────────────────
  const ownerCreatedNode = nodeEvents.some(
    (e) => e.action === "create" && e.scope === "global",
  );
  const ownerReviewedNode = nodeEvents.some(
    (e) => (e.action === "up" || e.action === "down") && e.scope === "global",
  );
  const actorCreateEvent = nodeEvents.find(
    (e) => e.action === "create" && e.userId === currentMemberId,
  );
  const actorCreatedNode = !!actorCreateEvent;
  const actorAbandonedNode = nodeEvents.some(
    (e) => e.action === "abandon" && e.userId === currentMemberId,
  );

  if (ownerCreatedNode) {
    res.error = "You cannot delete a node created by the teacher";
    return res;
  }
  if (ownerReviewedNode) {
    res.error =
      "You cannot delete a node that has already been reviewed by the teacher";
    return res;
  }
  if (actorAbandonedNode) {
    res.error = "You cannot delete a node you have previously abandoned";
    return res;
  }
  if (!actorCreatedNode) {
    res.error = "You cannot delete a node created by another student";
    return res;
  }

  const othersReviewedNode = nodeEvents.some(
    (e) =>
      (e.action === "up" || e.action === "down") &&
      e.scope === "local" &&
      e.userId !== currentMemberId,
  );

  if (!othersReviewedNode) {
    res.entities.nodes.remove.push(nodeId);
    res.events.nodes.remove.push(...nodeEvents.map((e) => e.id));
    res.entities.edges.remove.push(...affectedEdgeIds);
    res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
    return res;
  }

  // nod cu reviews de la alții → abandonăm nodul, procesăm edges
  for (const edgeId of affectedEdgeIds) {
    const edgeEventsForId = edgeEvents.filter((e) => e.entityId === edgeId);

    const ownerCreatedEdge = edgeEventsForId.some(
      (e) => e.action === "create" && e.scope === "global",
    );
    const ownerReviewedEdge = edgeEventsForId.some(
      (e) => (e.action === "up" || e.action === "down") && e.scope === "global",
    );

    if (ownerCreatedEdge) {
      res.error = "Cannot abandon node — has edges created by teacher";
      return res;
    }
    if (ownerReviewedEdge) {
      res.error = "Cannot abandon node — has edges reviewed by teacher";
      return res;
    }

    const actorCreatedEdgeEvent = edgeEventsForId.find(
      (e) => e.action === "create" && e.userId === currentMemberId,
    );
    const actorCreatedEdge = !!actorCreatedEdgeEvent;
    const actorAbandonedEdge = edgeEventsForId.some(
      (e) => e.action === "abandon" && e.userId === currentMemberId,
    );
    const actorReviewEvent = findReviewEvent(edgeEventsForId, {
      entityId: edgeId,
      actorRole: "GUEST",
      actorId: currentMemberId,
    });
    const actorReviewedEdge = !!actorReviewEvent;
    const othersReviewedEdge = edgeEventsForId.some(
      (e) =>
        (e.action === "up" || e.action === "down") &&
        e.scope === "local" &&
        e.userId !== currentMemberId,
    );

    if (actorCreatedEdge && !actorAbandonedEdge) {
      if (othersReviewedEdge) {
        res.events.edges.remove.push(actorCreatedEdgeEvent.id);
        res.events.edges.add.push({
          entityType: "edge",
          entityId: edgeId,
          action: "abandon",
          scope: "local",
          userId: currentMemberId,
        });
      } else {
        res.entities.edges.remove.push(edgeId);
        res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
      }
    } else if (actorAbandonedEdge) {
      if (actorReviewedEdge) {
        if (othersReviewedEdge) {
          res.events.edges.remove.push(actorReviewEvent.id);
        } else {
          res.entities.edges.remove.push(edgeId);
          res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
        }
      } else if (!othersReviewedEdge) {
        res.entities.edges.remove.push(edgeId);
        res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
      }
    } else {
      const isCreatedByOther = edgeEventsForId.some(
        (e) => e.action === "create" && e.userId !== currentMemberId,
      );
      if (isCreatedByOther) {
        if (actorReviewedEdge)
          res.events.edges.remove.push(actorReviewEvent.id);
      } else {
        if (actorReviewedEdge) {
          if (othersReviewedEdge) {
            res.events.edges.remove.push(actorReviewEvent.id);
          } else {
            res.entities.edges.remove.push(edgeId);
            res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
          }
        } else if (!othersReviewedEdge) {
          res.entities.edges.remove.push(edgeId);
          res.events.edges.remove.push(...edgeEventsForId.map((e) => e.id));
        }
      }
    }
  }

  res.events.nodes.remove.push(actorCreateEvent.id);
  res.events.nodes.add.push({
    entityType: "node",
    entityId: nodeId,
    action: "abandon",
    scope: "local",
    userId: currentMemberId,
  });

  return res;
}

export function resolveNodeVote(
  action,
  { events, currentMemberId, currentMemberRole, projectOwnerId, getMemberById },
) {
  const { nodeId, voteType } = action;
  const res = createEmptyResolution();

  const reviewState = getNodeReviewState(nodeId, events, {
    currentMemberId,
    currentMemberRole,
    projectOwnerId,
    getMemberById,
  });

  // ─── OWNER ────────────────────────────────────────────────────────────────
  if (currentMemberRole === "OWNER") {
    if (reviewState.ownerCreated) {
      res.error = "Cannot review own node";
      return res;
    }

    if (voteType === "up") {
      if (reviewState.ownerUpped) {
        const existing = findNodeEvent(events, {
          nodeId,
          action: "up",
          scope: "global",
          userId: null,
        });
        if (existing) res.events.nodes.remove.push(existing.id);
        return res;
      }
      if (reviewState.ownerDowned) {
        const existing = findNodeEvent(events, {
          nodeId,
          action: "down",
          scope: "global",
          userId: null,
        });
        if (existing) res.events.nodes.remove.push(existing.id);
      }
      res.events.nodes.add.push({
        entityType: "node",
        entityId: nodeId,
        action: "up",
        scope: "global",
        userId: null,
      });
      return res;
    }

    if (voteType === "down") {
      if (reviewState.ownerDowned) {
        const existing = findNodeEvent(events, {
          nodeId,
          action: "down",
          scope: "global",
          userId: null,
        });
        if (existing) res.events.nodes.remove.push(existing.id);
        return res;
      }
      if (reviewState.ownerUpped) {
        const existing = findNodeEvent(events, {
          nodeId,
          action: "up",
          scope: "global",
          userId: null,
        });
        if (existing) res.events.nodes.remove.push(existing.id);
      }

      // propagare owner down pe nod → edges adiacente cu +(0) devin -(0)
      const adjacentEdgeEvents = getAdjacentEdgeEvents(events, nodeId);
      for (const edgeId of getUniqueEdgeIds(adjacentEdgeEvents)) {
        const edgeEventsForId = adjacentEdgeEvents.filter(
          (e) => e.entityId === edgeId,
        );
        const ownerUppedEdge = edgeEventsForId.find(
          (e) => e.action === "up" && e.scope === "global" && e.userId === null,
        );
        if (ownerUppedEdge) {
          res.events.edges.remove.push(ownerUppedEdge.id);
          res.events.edges.add.push({
            entityType: "edge",
            entityId: edgeId,
            action: "down",
            scope: "global",
            userId: null,
          });
        }
      }

      res.events.nodes.add.push({
        entityType: "node",
        entityId: nodeId,
        action: "down",
        scope: "global",
        userId: null,
      });
      return res;
    }
  }

  // ─── GUEST ────────────────────────────────────────────────────────────────
  if (reviewState.ownerCreated || reviewState.ownerReviewed) {
    res.error = "Cannot review — node is locked by teacher";
    return res;
  }
  if (reviewState.currentCreated || reviewState.currentAbandoned) {
    res.error = "Cannot review own node";
    return res;
  }

  if (voteType === "up") {
    if (reviewState.currentUpped) {
      const existing = findNodeEvent(events, {
        nodeId,
        action: "up",
        scope: "local",
        userId: currentMemberId,
      });
      if (existing) res.events.nodes.remove.push(existing.id);

      // dacă nodul e abandonat și rămâne fără reviews → ștergem tot
      if (shouldDeleteAbandonedNode(nodeId, events, existing?.id)) {
        addAbandonedNodeCleanup(res, nodeId, events);
      }
      return res;
    }
    if (reviewState.currentDowned) {
      const existing = findNodeEvent(events, {
        nodeId,
        action: "down",
        scope: "local",
        userId: currentMemberId,
      });
      if (existing) res.events.nodes.remove.push(existing.id);
      // retrage și -(guest) de pe edges adiacente propagate anterior
      const adjacentEdgeEvents = getAdjacentEdgeEvents(events, nodeId);
      for (const edgeId of getUniqueEdgeIds(adjacentEdgeEvents)) {
        const edgeEventsForId = adjacentEdgeEvents.filter(
          (e) => e.entityId === edgeId,
        );
        const actorDownEdge = edgeEventsForId.find(
          (e) =>
            e.action === "down" &&
            e.scope === "local" &&
            e.userId === currentMemberId,
        );
        if (actorDownEdge) res.events.edges.remove.push(actorDownEdge.id);
      }
    }
    res.events.nodes.add.push({
      entityType: "node",
      entityId: nodeId,
      action: "up",
      scope: "local",
      userId: currentMemberId,
    });
    return res;
  }

  if (voteType === "down") {
    if (reviewState.currentDowned) {
      const existing = findNodeEvent(events, {
        nodeId,
        action: "down",
        scope: "local",
        userId: currentMemberId,
      });
      if (existing) res.events.nodes.remove.push(existing.id);
      // retrage -(guest) de pe edges adiacente
      const adjacentEdgeEvents = getAdjacentEdgeEvents(events, nodeId);
      for (const edgeId of getUniqueEdgeIds(adjacentEdgeEvents)) {
        const edgeEventsForId = adjacentEdgeEvents.filter(
          (e) => e.entityId === edgeId,
        );
        const actorDownEdge = edgeEventsForId.find(
          (e) =>
            e.action === "down" &&
            e.scope === "local" &&
            e.userId === currentMemberId,
        );
        if (actorDownEdge) res.events.edges.remove.push(actorDownEdge.id);
      }

      // dacă nodul e abandonat și rămâne fără reviews → ștergem tot
      if (shouldDeleteAbandonedNode(nodeId, events, existing?.id)) {
        addAbandonedNodeCleanup(res, nodeId, events);
      }
      return res;
    }
    if (reviewState.currentUpped) {
      const existing = findNodeEvent(events, {
        nodeId,
        action: "up",
        scope: "local",
        userId: currentMemberId,
      });
      if (existing) res.events.nodes.remove.push(existing.id);
    }

    // propagare guest down pe nod → edges adiacente
    const adjacentEdgeEvents = getAdjacentEdgeEvents(events, nodeId);
    for (const edgeId of getUniqueEdgeIds(adjacentEdgeEvents)) {
      const edgeEventsForId = adjacentEdgeEvents.filter(
        (e) => e.entityId === edgeId,
      );

      const ownerBlockedEdge = edgeEventsForId.some(
        (e) =>
          (e.action === "create" || e.action === "up" || e.action === "down") &&
          e.scope === "global",
      );
      if (ownerBlockedEdge) continue;

      const actorCreatedEdgeEvent = edgeEventsForId.find(
        (e) => e.action === "create" && e.userId === currentMemberId,
      );
      const actorAbandonedEdge = edgeEventsForId.some(
        (e) => e.action === "abandon" && e.userId === currentMemberId,
      );
      const actorUppedEdge = edgeEventsForId.find(
        (e) =>
          e.action === "up" &&
          e.scope === "local" &&
          e.userId === currentMemberId,
      );

      if (actorCreatedEdgeEvent && !actorAbandonedEdge) {
        res.events.edges.remove.push(actorCreatedEdgeEvent.id);
        res.events.edges.add.push({
          entityType: "edge",
          entityId: edgeId,
          action: "abandon",
          scope: "local",
          userId: currentMemberId,
        });
      } else if (actorUppedEdge) {
        res.events.edges.remove.push(actorUppedEdge.id);
        res.events.edges.add.push({
          entityType: "edge",
          entityId: edgeId,
          action: "down",
          scope: "local",
          userId: currentMemberId,
        });
      } else {
        res.events.edges.add.push({
          entityType: "edge",
          entityId: edgeId,
          action: "down",
          scope: "local",
          userId: currentMemberId,
        });
      }
    }

    res.events.nodes.add.push({
      entityType: "node",
      entityId: nodeId,
      action: "down",
      scope: "local",
      userId: currentMemberId,
    });
    return res;
  }

  res.error = "Invalid vote type";
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDGE RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

export function resolveEdgeCreate(
  action,
  { events, currentMemberId, currentMemberRole },
) {
  const { params } = action;
  const res = createEmptyResolution();

  if (!params.source || !params.target) {
    res.error = "Invalid edge params";
    return res;
  }
  if (params.source === params.target) {
    res.error = "Cannot connect node to itself";
    return res;
  }

  const edgeId = crypto.randomUUID();
  const scope = currentMemberRole === "OWNER" ? "global" : "local";

  const createEdgeObj = {
    ...params,
    id: edgeId,
    type: "custom",
    data: { createdBy: currentMemberId },
  };
  const createEdgeEvent = {
    entityType: "edge",
    entityId: edgeId,
    action: "create",
    scope,
    userId: scope === "local" ? currentMemberId : null,
    sourceId: params.source,
    targetId: params.target,
  };

  // ─── GUEST ────────────────────────────────────────────────────────────────
  if (currentMemberRole !== "OWNER") {
    const srcEvents = events.filter(
      (e) => e.entityType === "node" && e.entityId === params.source,
    );
    const tgtEvents = events.filter(
      (e) => e.entityType === "node" && e.entityId === params.target,
    );

    if (
      !isEntityTrueForActor(srcEvents, { actorId: currentMemberId }) ||
      !isEntityTrueForActor(tgtEvents, { actorId: currentMemberId })
    ) {
      res.error =
        "Cannot create edge — you must agree with both connected nodes first";
      return res;
    }

    const srcIsCreator = srcEvents.some(
      (e) => e.action === "create" && e.userId === currentMemberId,
    );
    const srcHasUp = srcEvents.some(
      (e) => e.action === "up" && e.userId === currentMemberId,
    );
    const srcOwnerApproved = srcEvents.some(
      (e) =>
        (e.action === "create" || e.action === "up") && e.scope === "global",
    );

    const tgtIsCreator = tgtEvents.some(
      (e) => e.action === "create" && e.userId === currentMemberId,
    );
    const tgtHasUp = tgtEvents.some(
      (e) => e.action === "up" && e.userId === currentMemberId,
    );
    const tgtOwnerApproved = tgtEvents.some(
      (e) =>
        (e.action === "create" || e.action === "up") && e.scope === "global",
    );

    if (!srcIsCreator && !srcHasUp && !srcOwnerApproved) {
      const srcDown = srcEvents.find(
        (e) =>
          e.action === "down" &&
          e.scope === "local" &&
          e.userId === currentMemberId,
      );
      if (srcDown) res.events.nodes.remove.push(srcDown.id);
      res.events.nodes.add.push({
        entityType: "node",
        entityId: params.source,
        action: "up",
        scope: "local",
        userId: currentMemberId,
      });
    }

    if (!tgtIsCreator && !tgtHasUp && !tgtOwnerApproved) {
      const tgtDown = tgtEvents.find(
        (e) =>
          e.action === "down" &&
          e.scope === "local" &&
          e.userId === currentMemberId,
      );
      if (tgtDown) res.events.nodes.remove.push(tgtDown.id);
      res.events.nodes.add.push({
        entityType: "node",
        entityId: params.target,
        action: "up",
        scope: "local",
        userId: currentMemberId,
      });
    }

    res.entities.edges.add.push(createEdgeObj);
    res.events.edges.add.push(createEdgeEvent);
    return res;
  }
  // ─── OWNER ────────────────────────────────────────────────────────────────
  const srcEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === params.source,
  );
  const tgtEvents = events.filter(
    (e) => e.entityType === "node" && e.entityId === params.target,
  );

  const srcApproved = srcEvents.some(
    (e) => (e.action === "up" || e.action === "create") && e.scope === "global",
  );
  const tgtApproved = tgtEvents.some(
    (e) => (e.action === "up" || e.action === "create") && e.scope === "global",
  );

  if (!srcApproved || !tgtApproved) {
    if (!srcApproved) {
      const srcDown = srcEvents.find(
        (e) => e.action === "down" && e.scope === "global",
      );
      if (srcDown) res.events.nodes.remove.push(srcDown.id);
      res.events.nodes.add.push({
        entityType: "node",
        entityId: params.source,
        action: "up",
        scope: "global",
        userId: null,
      });
    }
    if (!tgtApproved) {
      const tgtDown = tgtEvents.find(
        (e) => e.action === "down" && e.scope === "global",
      );
      if (tgtDown) res.events.nodes.remove.push(tgtDown.id);
      res.events.nodes.add.push({
        entityType: "node",
        entityId: params.target,
        action: "up",
        scope: "global",
        userId: null,
      });
    }
    res.requiresConfirm = {
      message: "Edge creation will assume upvoting connected nodes. Continue?",
    };
  }

  res.entities.edges.add.push(createEdgeObj);
  res.events.edges.add.push(createEdgeEvent);
  return res;
}

export function resolveEdgeDelete(
  action,
  { events, currentMemberId, currentMemberRole },
) {
  const { edgeId } = action;
  const res = createEmptyResolution();

  const edgeEvents = events.filter(
    (e) => e.entityType === "edge" && e.entityId === edgeId,
  );

  if (currentMemberRole === "OWNER") {
    res.entities.edges.remove.push(edgeId);
    res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
    return res;
  }

  const ownerReviewed = edgeEvents.some(
    (e) =>
      (e.action === "up" || e.action === "down" || e.action === "create") &&
      e.scope === "global",
  );
  if (ownerReviewed) {
    res.error = "Cannot delete — edge is locked by teacher";
    return res;
  }

  const actorCreatedEvent = edgeEvents.find(
    (e) => e.action === "create" && e.userId === currentMemberId,
  );
  if (!actorCreatedEvent) {
    res.error = "Cannot delete — you are not the creator";
    return res;
  }

  const actorAbandoned = edgeEvents.some(
    (e) => e.action === "abandon" && e.userId === currentMemberId,
  );
  if (actorAbandoned) {
    res.error = "Cannot delete — edge was previously abandoned";
    return res;
  }

  const othersReviewed = edgeEvents.some(
    (e) =>
      (e.action === "up" || e.action === "down") &&
      e.scope === "local" &&
      e.userId !== currentMemberId,
  );

  if (othersReviewed) {
    res.events.edges.remove.push(actorCreatedEvent.id);
    res.events.edges.add.push({
      entityType: "edge",
      entityId: edgeId,
      action: "abandon",
      scope: "local",
      userId: currentMemberId,
    });
  } else {
    res.entities.edges.remove.push(edgeId);
    res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
  }

  return res;
}

export function resolveEdgeVote(
  action,
  { events, currentMemberId, currentMemberRole, projectOwnerId, getMemberById },
) {
  const { edgeId, voteType } = action;
  const res = createEmptyResolution();

  const reviewState = getEdgeReviewState(edgeId, events, {
    currentMemberId,
    currentMemberRole,
    projectOwnerId,
    getMemberById,
  });

  if (reviewState.ownerReviewed || reviewState.ownerCreated) {
    res.error = "Cannot review — edge is locked by teacher";
    return res;
  }
  if (reviewState.currentCreated && !reviewState.currentAbandoned) {
    res.error = "Cannot review own edge";
    return res;
  }

  const edgeCreateEvent = events.find(
    (e) =>
      e.entityType === "edge" && e.entityId === edgeId && e.action === "create",
  );
  const sourceId = edgeCreateEvent?.sourceId;
  const targetId = edgeCreateEvent?.targetId;

  const scope = currentMemberRole === "OWNER" ? "global" : "local";
  const userId = scope === "local" ? currentMemberId : null;

  if (voteType === "up") {
    if (reviewState.currentUpped) {
      const existing = findReviewEvent(events, {
        entityId: edgeId,
        actorRole: currentMemberRole,
        actorId: currentMemberId,
      });
      if (existing) res.events.edges.remove.push(existing.id);

      // dacă edge e abandonat și rămâne fără reviews → ștergem tot
      const edgeEvents = events.filter(
        (e) => e.entityType === "edge" && e.entityId === edgeId,
      );
      const isAbandoned = edgeEvents.some((e) => e.action === "abandon");
      const remainingReviews = edgeEvents.filter(
        (e) =>
          (e.action === "up" || e.action === "down") && e.id !== existing?.id,
      );
      if (isAbandoned && remainingReviews.length === 0) {
        res.entities.edges.remove.push(edgeId);
        res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
      }

      return res;
    }
    if (reviewState.currentDowned) {
      const existing = findReviewEvent(events, {
        entityId: edgeId,
        actorRole: currentMemberRole,
        actorId: currentMemberId,
      });
      if (existing) res.events.edges.remove.push(existing.id);
    }

    // propagare up pe noduri adiacente
    for (const nodeId of [sourceId, targetId].filter(Boolean)) {
      const nodeEvents = events.filter(
        (e) => e.entityType === "node" && e.entityId === nodeId,
      );
      const isCreator = nodeEvents.some(
        (e) =>
          e.action === "create" &&
          (scope === "global"
            ? e.scope === "global"
            : e.userId === currentMemberId),
      );
      const hasUp = nodeEvents.some(
        (e) =>
          e.action === "up" &&
          (scope === "global"
            ? e.scope === "global" && e.userId === null
            : e.scope === "local" && e.userId === currentMemberId),
      );
      if (!isCreator && !hasUp) {
        const downEvent = nodeEvents.find(
          (e) =>
            e.action === "down" &&
            (scope === "global"
              ? e.scope === "global" && e.userId === null
              : e.scope === "local" && e.userId === currentMemberId),
        );
        if (downEvent) res.events.nodes.remove.push(downEvent.id);
        res.events.nodes.add.push({
          entityType: "node",
          entityId: nodeId,
          action: "up",
          scope,
          userId,
        });
      }
    }

    res.events.edges.add.push({
      entityType: "edge",
      entityId: edgeId,
      action: "up",
      scope,
      userId,
    });
    return res;
  }

  if (voteType === "down") {
    if (reviewState.currentDowned) {
      const existing = findReviewEvent(events, {
        entityId: edgeId,
        actorRole: currentMemberRole,
        actorId: currentMemberId,
      });
      if (existing) res.events.edges.remove.push(existing.id);

      // dacă edge e abandonat și rămâne fără reviews → ștergem tot
      const edgeEvents = events.filter(
        (e) => e.entityType === "edge" && e.entityId === edgeId,
      );
      const isAbandoned = edgeEvents.some((e) => e.action === "abandon");
      const remainingReviews = edgeEvents.filter(
        (e) =>
          (e.action === "up" || e.action === "down") && e.id !== existing?.id,
      );
      if (isAbandoned && remainingReviews.length === 0) {
        res.entities.edges.remove.push(edgeId);
        res.events.edges.remove.push(...edgeEvents.map((e) => e.id));
      }

      return res;
    }
    if (reviewState.currentUpped) {
      const existing = findReviewEvent(events, {
        entityId: edgeId,
        actorRole: currentMemberRole,
        actorId: currentMemberId,
      });
      if (existing) res.events.edges.remove.push(existing.id);
    }
    // down pe edge nu propagă pe noduri
    res.events.edges.add.push({
      entityType: "edge",
      entityId: edgeId,
      action: "down",
      scope,
      userId,
    });
    return res;
  }

  res.error = "Invalid vote type";
  return res;
}
