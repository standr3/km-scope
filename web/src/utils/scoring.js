// ─────────────────────────────────────────────────────────────────────────────
// SCORING — funcții pure
// Primesc events din Yjs și returnează scoruri per guest
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_WEIGHTS = {
  weight_node_create: 1.50,
  weight_edge_create: 1.25,
  weight_node_agree: 1.00,
  weight_edge_agree: 1.00,
  weight_node_disagree: 0.75,
  weight_edge_disagree: 0.75,
  penalty_undecided: 0.50,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getNodeOwnerDecision(nodeId, events) {
  const nodeEvents = events.filter(
    (e) => e.entityType === 'node' && e.entityId === nodeId
  );
  if (nodeEvents.some((e) => e.action === 'create' && e.scope === 'global'))
    return 'OWNER_CREATED';
  if (nodeEvents.some((e) => e.action === 'up' && e.scope === 'global' && e.userId === null))
    return 'ACCEPTED';
  if (nodeEvents.some((e) => e.action === 'down' && e.scope === 'global' && e.userId === null))
    return 'REJECTED';
  return 'PENDING';
}

function getEdgeOwnerDecision(edgeId, events) {
  const edgeEvents = events.filter(
    (e) => e.entityType === 'edge' && e.entityId === edgeId
  );
  if (edgeEvents.some((e) => e.action === 'create' && e.scope === 'global'))
    return 'OWNER_CREATED';
  if (edgeEvents.some((e) => e.action === 'up' && e.scope === 'global' && e.userId === null))
    return 'ACCEPTED';
  if (edgeEvents.some((e) => e.action === 'down' && e.scope === 'global' && e.userId === null))
    return 'REJECTED';
  return 'PENDING';
}

function getUniqueEntityIds(events, entityType) {
  return [...new Set(events.filter((e) => e.entityType === entityType).map((e) => e.entityId))];
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCUL SCOR PER GUEST
// ─────────────────────────────────────────────────────────────────────────────

export function computeGuestScore(guestId, events, ownerId, weights = DEFAULT_WEIGHTS) {
  const w = weights;
  const rewards = [];
  const penalties = [];

  const nodeIds = getUniqueEntityIds(events, 'node');
  const edgeIds = getUniqueEntityIds(events, 'edge');

  // noduri create de guest
  const myNodeIds = events
    .filter((e) => e.entityType === 'node' && e.action === 'create' && e.scope === 'local' && e.userId === guestId)
    .map((e) => e.entityId);

  let nodesCreated = myNodeIds.length;
  let nodesCreatedAccepted = 0, nodesCreatedRejected = 0, nodesCreatedPending = 0;
  for (const id of myNodeIds) {
    const d = getNodeOwnerDecision(id, events);
    if (d === 'ACCEPTED') nodesCreatedAccepted++;
    else if (d === 'REJECTED') nodesCreatedRejected++;
    else nodesCreatedPending++;
  }

  // edges create de guest
  const myEdgeIds = events
    .filter((e) => e.entityType === 'edge' && e.action === 'create' && e.scope === 'local' && e.userId === guestId)
    .map((e) => e.entityId);

  let edgesCreated = myEdgeIds.length;
  let edgesCreatedAccepted = 0, edgesCreatedRejected = 0, edgesCreatedPending = 0;
  for (const id of myEdgeIds) {
    const d = getEdgeOwnerDecision(id, events);
    if (d === 'ACCEPTED') edgesCreatedAccepted++;
    else if (d === 'REJECTED') edgesCreatedRejected++;
    else edgesCreatedPending++;
  }

  // up pe noduri create de alții
  const myNodeUpEvents = events.filter(
    (e) => e.entityType === 'node' && e.action === 'up' && e.scope === 'local' &&
      e.userId === guestId && !myNodeIds.includes(e.entityId)
  );
  let nodesAgreed = myNodeUpEvents.length;
  let nodesAgreedCorrect = 0, nodesAgreedWrong = 0, nodesAgreedPending = 0;
  for (const ev of myNodeUpEvents) {
    const d = getNodeOwnerDecision(ev.entityId, events);
    if (d === 'ACCEPTED') nodesAgreedCorrect++;
    else if (d === 'REJECTED') nodesAgreedWrong++;
    else nodesAgreedPending++;
  }

  // down pe noduri
  const myNodeDownEvents = events.filter(
    (e) => e.entityType === 'node' && e.action === 'down' && e.scope === 'local' && e.userId === guestId
  );
  let nodesDisagreed = myNodeDownEvents.length;
  let nodesDisagreedCorrect = 0, nodesDisagreedWrong = 0;
  for (const ev of myNodeDownEvents) {
    const d = getNodeOwnerDecision(ev.entityId, events);
    if (d === 'REJECTED') nodesDisagreedCorrect++;
    else if (d === 'ACCEPTED') nodesDisagreedWrong++;
  }

  // up pe edges create de alții
  const myEdgeUpEvents = events.filter(
    (e) => e.entityType === 'edge' && e.action === 'up' && e.scope === 'local' &&
      e.userId === guestId && !myEdgeIds.includes(e.entityId)
  );
  let edgesAgreed = myEdgeUpEvents.length;
  let edgesAgreedCorrect = 0, edgesAgreedWrong = 0, edgesAgreedPending = 0;
  for (const ev of myEdgeUpEvents) {
    const d = getEdgeOwnerDecision(ev.entityId, events);
    if (d === 'ACCEPTED') edgesAgreedCorrect++;
    else if (d === 'REJECTED') edgesAgreedWrong++;
    else edgesAgreedPending++;
  }

  // down pe edges
  const myEdgeDownEvents = events.filter(
    (e) => e.entityType === 'edge' && e.action === 'down' && e.scope === 'local' && e.userId === guestId
  );
  let edgesDisagreed = myEdgeDownEvents.length;
  let edgesDisagreedCorrect = 0, edgesDisagreedWrong = 0;
  for (const ev of myEdgeDownEvents) {
    const d = getEdgeOwnerDecision(ev.entityId, events);
    if (d === 'REJECTED') edgesDisagreedCorrect++;
    else if (d === 'ACCEPTED') edgesDisagreedWrong++;
  }

  // undecided
  const myVotedNodeIds = new Set([...myNodeUpEvents, ...myNodeDownEvents].map((e) => e.entityId));
  let nodesUndecided = 0;
  for (const id of nodeIds) {
    if (myNodeIds.includes(id)) continue;
    const d = getNodeOwnerDecision(id, events);
    if (d === 'OWNER_CREATED' || d === 'PENDING') continue;
    if (!myVotedNodeIds.has(id)) nodesUndecided++;
  }

  const myVotedEdgeIds = new Set([...myEdgeUpEvents, ...myEdgeDownEvents].map((e) => e.entityId));
  let edgesUndecided = 0;
  for (const id of edgeIds) {
    if (myEdgeIds.includes(id)) continue;
    const d = getEdgeOwnerDecision(id, events);
    if (d === 'OWNER_CREATED' || d === 'PENDING') continue;
    if (!myVotedEdgeIds.has(id)) edgesUndecided++;
  }

  // scor brut
  let rawScore = 0;
  rawScore += nodesCreatedAccepted  * w.weight_node_create * 2;
  rawScore += edgesCreatedAccepted  * w.weight_edge_create * 2;
  rawScore -= nodesCreatedRejected  * w.weight_node_create;
  rawScore -= edgesCreatedRejected  * w.weight_edge_create;
  rawScore += nodesAgreedCorrect    * w.weight_node_agree;
  rawScore += edgesAgreedCorrect    * w.weight_edge_agree;
  rawScore -= nodesAgreedWrong      * w.weight_node_agree;
  rawScore -= edgesAgreedWrong      * w.weight_edge_agree;
  rawScore += nodesDisagreedCorrect * w.weight_node_disagree;
  rawScore += edgesDisagreedCorrect * w.weight_edge_disagree;
  rawScore -= nodesDisagreedWrong   * w.weight_node_disagree;
  rawScore -= edgesDisagreedWrong   * w.weight_edge_disagree;
  rawScore -= (nodesUndecided + edgesUndecided) * w.penalty_undecided;

  // scor maxim posibil
  const maxScore =
    nodeIds.filter((id) => getNodeOwnerDecision(id, events) === 'ACCEPTED').length * w.weight_node_create * 2 +
    edgeIds.filter((id) => getEdgeOwnerDecision(id, events) === 'ACCEPTED').length * w.weight_edge_create * 2;

  const performancePct = maxScore > 0
    ? Math.max(0, Math.min(100, (rawScore / maxScore) * 100))
    : 0;

  // trust factor
  const totalDecisions =
    nodesCreatedAccepted + nodesCreatedRejected + edgesCreatedAccepted + edgesCreatedRejected +
    nodesAgreedCorrect + nodesAgreedWrong + edgesAgreedCorrect + edgesAgreedWrong +
    nodesDisagreedCorrect + nodesDisagreedWrong + edgesDisagreedCorrect + edgesDisagreedWrong;

  const correctDecisions =
    nodesCreatedAccepted + edgesCreatedAccepted +
    nodesAgreedCorrect + edgesAgreedCorrect +
    nodesDisagreedCorrect + edgesDisagreedCorrect;

  const trustFactor = totalDecisions > 0
    ? Math.min(2.0, (correctDecisions / totalDecisions) + (nodesCreatedAccepted + edgesCreatedAccepted) * 0.1)
    : 0;

  // personality tags
  const tags = [];
  if (nodesCreated + edgesCreated > 2)                                   tags.push('initiator');
  if (nodesCreated > edgesCreated * 2)                                   tags.push('idea_generator');
  if (edgesCreated > nodesCreated * 2)                                   tags.push('connector');
  if (nodesCreated > 0 && nodesCreatedAccepted / nodesCreated > 0.7)    tags.push('risk_taker');
  if (nodesAgreed + edgesAgreed > nodesCreated + edgesCreated)          tags.push('follower');
  if (nodesDisagreed + edgesDisagreed > nodesAgreed + edgesAgreed)      tags.push('contrarian');
  if (nodesUndecided + edgesUndecided > 3)                              tags.push('passive');
  if ((nodesUndecided + edgesUndecided) === 0 && totalDecisions > 0)    tags.push('engaged');

  // rewards / penalties breakdown
  if (nodesCreatedAccepted > 0)
    rewards.push({ reason: 'node_created_accepted', count: nodesCreatedAccepted, points: nodesCreatedAccepted * w.weight_node_create * 2 });
  if (edgesCreatedAccepted > 0)
    rewards.push({ reason: 'edge_created_accepted', count: edgesCreatedAccepted, points: edgesCreatedAccepted * w.weight_edge_create * 2 });
  if (nodesAgreedCorrect > 0)
    rewards.push({ reason: 'node_agreed_correct', count: nodesAgreedCorrect, points: nodesAgreedCorrect * w.weight_node_agree });
  if (edgesAgreedCorrect > 0)
    rewards.push({ reason: 'edge_agreed_correct', count: edgesAgreedCorrect, points: edgesAgreedCorrect * w.weight_edge_agree });
  if (nodesDisagreedCorrect > 0)
    rewards.push({ reason: 'node_disagreed_correct', count: nodesDisagreedCorrect, points: nodesDisagreedCorrect * w.weight_node_disagree });
  if (edgesDisagreedCorrect > 0)
    rewards.push({ reason: 'edge_disagreed_correct', count: edgesDisagreedCorrect, points: edgesDisagreedCorrect * w.weight_edge_disagree });

  if (nodesCreatedRejected > 0)
    penalties.push({ reason: 'node_created_rejected', count: nodesCreatedRejected, points: nodesCreatedRejected * w.weight_node_create });
  if (edgesCreatedRejected > 0)
    penalties.push({ reason: 'edge_created_rejected', count: edgesCreatedRejected, points: edgesCreatedRejected * w.weight_edge_create });
  if (nodesAgreedWrong > 0)
    penalties.push({ reason: 'node_agreed_wrong', count: nodesAgreedWrong, points: nodesAgreedWrong * w.weight_node_agree });
  if (edgesAgreedWrong > 0)
    penalties.push({ reason: 'edge_agreed_wrong', count: edgesAgreedWrong, points: edgesAgreedWrong * w.weight_edge_agree });
  if (nodesUndecided + edgesUndecided > 0)
    penalties.push({ reason: 'undecided', count: nodesUndecided + edgesUndecided, points: (nodesUndecided + edgesUndecided) * w.penalty_undecided });

  return {
    guestId,
    trustFactor: parseFloat(trustFactor.toFixed(4)),
    performancePct: parseFloat(performancePct.toFixed(2)),
    rawScore: parseFloat(rawScore.toFixed(2)),
    nodesCreated, nodesCreatedAccepted, nodesCreatedRejected, nodesCreatedPending,
    edgesCreated, edgesCreatedAccepted, edgesCreatedRejected, edgesCreatedPending,
    nodesAgreed, nodesAgreedCorrect, nodesAgreedWrong, nodesAgreedPending,
    edgesAgreed, edgesAgreedCorrect, edgesAgreedWrong, edgesAgreedPending,
    nodesDisagreed, nodesDisagreedCorrect, nodesDisagreedWrong,
    edgesDisagreed, edgesDisagreedCorrect, edgesDisagreedWrong,
    nodesUndecided, edgesUndecided,
    tags, rewards, penalties,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCUL SCORURI PENTRU TOȚI GUESTS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSessionScores(events, members, ownerId, weights = DEFAULT_WEIGHTS) {
  const guests = members.filter((m) => m.id !== ownerId);
  return guests.map((guest) => ({
    ...computeGuestScore(guest.id, events, ownerId, weights),
    guestName: guest.name,
  }));
}