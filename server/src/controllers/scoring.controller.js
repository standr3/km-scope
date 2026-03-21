import pool from "../db/pool.js";

function httpErr(res, code, message) {
  return res.status(code).json({ success: false, message });
}

async function getProjectAuth(projectId, userId) {
  const q = await pool.query(
    `SELECT p.id, p.owner_id, p.class_id, c.teacher_id
     FROM projects p
     LEFT JOIN classes c ON c.id = p.class_id
     WHERE p.id = $1`,
    [projectId]
  );
  const pr = q.rows[0];
  if (!pr) return null;

  let canAccess = false;
  if (pr.owner_id === userId) canAccess = true;
  else if (pr.teacher_id && pr.teacher_id === userId) canAccess = true;
  else if (pr.class_id) {
    const sc = await pool.query(
      "SELECT 1 FROM stud_classes WHERE class_id=$1 AND student_id=$2 LIMIT 1",
      [pr.class_id, userId]
    );
    if (sc.rows[0]) canAccess = true;
  }
  return canAccess ? pr : { denied: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCUL SCOR PER GUEST
// Funcție pură — nu scrie în DB
// ─────────────────────────────────────────────────────────────────────────────

function computeGuestScore(guest, nodes, edges, nodeReviews, edgeReviews, cfg, ownerId) {
  const guestId = guest.id;
  const rewards = [];
  const penalties = [];

  // ── noduri create de guest ────────────────────────────────────────────────
  const myNodes = nodes.filter(n => n.creator_id === guestId);
  const nodesCreated          = myNodes.length;
  const nodesCreatedAccepted  = myNodes.filter(n => n.owner_decision === 'ACCEPTED').length;
  const nodesCreatedRejected  = myNodes.filter(n => n.owner_decision === 'REJECTED').length;
  const nodesCreatedPending   = myNodes.filter(n => n.owner_decision === 'PENDING').length;

  // ── edges create de guest ─────────────────────────────────────────────────
  const myEdges = edges.filter(e => e.creator_id === guestId);
  const edgesCreated          = myEdges.length;
  const edgesCreatedAccepted  = myEdges.filter(e => e.owner_decision === 'ACCEPTED').length;
  const edgesCreatedRejected  = myEdges.filter(e => e.owner_decision === 'REJECTED').length;
  const edgesCreatedPending   = myEdges.filter(e => e.owner_decision === 'PENDING').length;

  // ── reviews noduri ────────────────────────────────────────────────────────
  const myNodeReviews  = nodeReviews.filter(r => r.reviewer_id === guestId);
  const myNodeEndorses = myNodeReviews.filter(r => r.verdict === 'ENDORSE');
  const myNodeOpposes  = myNodeReviews.filter(r => r.verdict === 'OPPOSE');

  const nodesAgreed    = myNodeEndorses.length;
  const nodesDisagreed = myNodeOpposes.length;

  const nodesAgreedCorrect = myNodeEndorses.filter(r => {
    const node = nodes.find(n => n.id === r.node_id);
    return node?.owner_decision === 'ACCEPTED';
  }).length;
  const nodesAgreedWrong = myNodeEndorses.filter(r => {
    const node = nodes.find(n => n.id === r.node_id);
    return node?.owner_decision === 'REJECTED';
  }).length;
  const nodesAgreedPending = nodesAgreed - nodesAgreedCorrect - nodesAgreedWrong;

  const nodesDisagreedCorrect = myNodeOpposes.filter(r => {
    const node = nodes.find(n => n.id === r.node_id);
    return node?.owner_decision === 'REJECTED';
  }).length;
  const nodesDisagreedWrong = myNodeOpposes.filter(r => {
    const node = nodes.find(n => n.id === r.node_id);
    return node?.owner_decision === 'ACCEPTED';
  }).length;

  // ── reviews edges ─────────────────────────────────────────────────────────
  const myEdgeReviews  = edgeReviews.filter(r => r.reviewer_id === guestId);
  const myEdgeEndorses = myEdgeReviews.filter(r => r.verdict === 'ENDORSE');
  const myEdgeOpposes  = myEdgeReviews.filter(r => r.verdict === 'OPPOSE');

  const edgesAgreed    = myEdgeEndorses.length;
  const edgesDisagreed = myEdgeOpposes.length;

  const edgesAgreedCorrect = myEdgeEndorses.filter(r => {
    const edge = edges.find(e => e.id === r.edge_id);
    return edge?.owner_decision === 'ACCEPTED';
  }).length;
  const edgesAgreedWrong = myEdgeEndorses.filter(r => {
    const edge = edges.find(e => e.id === r.edge_id);
    return edge?.owner_decision === 'REJECTED';
  }).length;
  const edgesAgreedPending = edgesAgreed - edgesAgreedCorrect - edgesAgreedWrong;

  const edgesDisagreedCorrect = myEdgeOpposes.filter(r => {
    const edge = edges.find(e => e.id === r.edge_id);
    return edge?.owner_decision === 'REJECTED';
  }).length;
  const edgesDisagreedWrong = myEdgeOpposes.filter(r => {
    const edge = edges.find(e => e.id === r.edge_id);
    return edge?.owner_decision === 'ACCEPTED';
  }).length;

  // ── undecided ─────────────────────────────────────────────────────────────
  const votableNodesForGuest = nodes.filter(n =>
    n.creator_id !== guestId && n.creator_id !== ownerId
  );
  const myNodeVotedIds = new Set(myNodeReviews.map(r => r.node_id));
  const nodesUndecided = votableNodesForGuest.filter(n =>
    !myNodeVotedIds.has(n.id) && n.owner_decision !== 'PENDING'
  ).length;

  const votableEdgesForGuest = edges.filter(e =>
    e.creator_id !== guestId && e.creator_id !== ownerId
  );
  const myEdgeVotedIds = new Set(myEdgeReviews.map(r => r.edge_id));
  const edgesUndecided = votableEdgesForGuest.filter(e =>
    !myEdgeVotedIds.has(e.id) && e.owner_decision !== 'PENDING'
  ).length;

  // ── calcul scor ───────────────────────────────────────────────────────────
  const w = cfg;
  let rawScore = 0;

  rawScore += nodesCreatedAccepted  * Number(w.weight_node_create)   * 2;
  rawScore += edgesCreatedAccepted  * Number(w.weight_edge_create)   * 2;
  rawScore -= nodesCreatedRejected  * Number(w.weight_node_create);
  rawScore -= edgesCreatedRejected  * Number(w.weight_edge_create);
  rawScore += nodesAgreedCorrect    * Number(w.weight_node_agree);
  rawScore += edgesAgreedCorrect    * Number(w.weight_edge_agree);
  rawScore -= nodesAgreedWrong      * Number(w.weight_node_agree);
  rawScore -= edgesAgreedWrong      * Number(w.weight_edge_agree);
  rawScore += nodesDisagreedCorrect * Number(w.weight_node_disagree);
  rawScore += edgesDisagreedCorrect * Number(w.weight_edge_disagree);
  rawScore -= nodesDisagreedWrong   * Number(w.weight_node_disagree);
  rawScore -= edgesDisagreedWrong   * Number(w.weight_edge_disagree);
  rawScore -= (nodesUndecided + edgesUndecided) * Number(w.penalty_undecided);

  // ── scor maxim posibil ────────────────────────────────────────────────────
  const totalOwnerAcceptedNodes = nodes.filter(n => n.owner_decision === 'ACCEPTED').length;
  const totalOwnerAcceptedEdges = edges.filter(e => e.owner_decision === 'ACCEPTED').length;
  const maxScore =
    (totalOwnerAcceptedNodes * Number(w.weight_node_create) * 2) +
    (totalOwnerAcceptedEdges * Number(w.weight_edge_create) * 2);

  const performancePct = maxScore > 0
    ? Math.max(0, Math.min(100, (rawScore / maxScore) * 100))
    : 0;

  // ── trust factor ──────────────────────────────────────────────────────────
  const totalDecisions =
    nodesAgreedCorrect + nodesAgreedWrong +
    nodesDisagreedCorrect + nodesDisagreedWrong +
    nodesCreatedAccepted + nodesCreatedRejected +
    edgesAgreedCorrect + edgesAgreedWrong +
    edgesDisagreedCorrect + edgesDisagreedWrong +
    edgesCreatedAccepted + edgesCreatedRejected;

  const correctDecisions =
    nodesAgreedCorrect + nodesDisagreedCorrect + nodesCreatedAccepted +
    edgesAgreedCorrect + edgesDisagreedCorrect + edgesCreatedAccepted;

  const creatorBonus = (nodesCreatedAccepted + edgesCreatedAccepted) * 0.1;

  const trustFactor = totalDecisions > 0
    ? Math.min(2.0, (correctDecisions / totalDecisions) + creatorBonus)
    : 0;

  // ── personality tags ──────────────────────────────────────────────────────
  const tags = [];
  if (nodesCreated + edgesCreated > 2)                                    tags.push('initiator');
  if (nodesCreated > edgesCreated * 2)                                    tags.push('idea_generator');
  if (edgesCreated > nodesCreated * 2)                                    tags.push('connector');
  if (nodesCreatedAccepted / Math.max(nodesCreated, 1) > 0.7)            tags.push('risk_taker');
  if (nodesAgreed + edgesAgreed > nodesCreated + edgesCreated)            tags.push('follower');
  if (nodesDisagreed + edgesDisagreed > nodesAgreed + edgesAgreed)        tags.push('contrarian');
  if (nodesUndecided + edgesUndecided > 3)                                tags.push('passive');
  if ((nodesUndecided + edgesUndecided) === 0 && totalDecisions > 0)      tags.push('engaged');

  // ── rewards / penalties breakdown ─────────────────────────────────────────
  if (nodesCreatedAccepted > 0)
    rewards.push({ reason: 'node_created_accepted', count: nodesCreatedAccepted, points: nodesCreatedAccepted * Number(w.weight_node_create) * 2 });
  if (edgesCreatedAccepted > 0)
    rewards.push({ reason: 'edge_created_accepted', count: edgesCreatedAccepted, points: edgesCreatedAccepted * Number(w.weight_edge_create) * 2 });
  if (nodesAgreedCorrect > 0)
    rewards.push({ reason: 'node_agreed_correct', count: nodesAgreedCorrect, points: nodesAgreedCorrect * Number(w.weight_node_agree) });
  if (edgesAgreedCorrect > 0)
    rewards.push({ reason: 'edge_agreed_correct', count: edgesAgreedCorrect, points: edgesAgreedCorrect * Number(w.weight_edge_agree) });
  if (nodesDisagreedCorrect > 0)
    rewards.push({ reason: 'node_disagreed_correct', count: nodesDisagreedCorrect, points: nodesDisagreedCorrect * Number(w.weight_node_disagree) });
  if (edgesDisagreedCorrect > 0)
    rewards.push({ reason: 'edge_disagreed_correct', count: edgesDisagreedCorrect, points: edgesDisagreedCorrect * Number(w.weight_edge_disagree) });

  if (nodesCreatedRejected > 0)
    penalties.push({ reason: 'node_created_rejected', count: nodesCreatedRejected, points: nodesCreatedRejected * Number(w.weight_node_create) });
  if (edgesCreatedRejected > 0)
    penalties.push({ reason: 'edge_created_rejected', count: edgesCreatedRejected, points: edgesCreatedRejected * Number(w.weight_edge_create) });
  if (nodesAgreedWrong > 0)
    penalties.push({ reason: 'node_agreed_wrong', count: nodesAgreedWrong, points: nodesAgreedWrong * Number(w.weight_node_agree) });
  if (edgesAgreedWrong > 0)
    penalties.push({ reason: 'edge_agreed_wrong', count: edgesAgreedWrong, points: edgesAgreedWrong * Number(w.weight_edge_agree) });
  if (nodesUndecided + edgesUndecided > 0)
    penalties.push({ reason: 'undecided', count: nodesUndecided + edgesUndecided, points: (nodesUndecided + edgesUndecided) * Number(w.penalty_undecided) });

  return {
    user_id: guestId,
    user_name: guest.name,
    trust_factor: parseFloat(trustFactor.toFixed(4)),
    performance_pct: parseFloat(performancePct.toFixed(2)),
    nodes_created: nodesCreated,
    nodes_created_accepted: nodesCreatedAccepted,
    nodes_created_rejected: nodesCreatedRejected,
    nodes_created_pending: nodesCreatedPending,
    edges_created: edgesCreated,
    edges_created_accepted: edgesCreatedAccepted,
    edges_created_rejected: edgesCreatedRejected,
    edges_created_pending: edgesCreatedPending,
    nodes_agreed: nodesAgreed,
    nodes_agreed_correct: nodesAgreedCorrect,
    nodes_agreed_wrong: nodesAgreedWrong,
    nodes_agreed_pending: nodesAgreedPending,
    edges_agreed: edgesAgreed,
    edges_agreed_correct: edgesAgreedCorrect,
    edges_agreed_wrong: edgesAgreedWrong,
    edges_agreed_pending: edgesAgreedPending,
    nodes_disagreed: nodesDisagreed,
    nodes_disagreed_correct: nodesDisagreedCorrect,
    nodes_disagreed_wrong: nodesDisagreedWrong,
    edges_disagreed: edgesDisagreed,
    edges_disagreed_correct: edgesDisagreedCorrect,
    edges_disagreed_wrong: edgesDisagreedWrong,
    nodes_undecided: nodesUndecided,
    edges_undecided: edgesUndecided,
    personality_tags: tags,
    rewards_breakdown: rewards,
    penalties_breakdown: penalties,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ÎNCARCĂ DATE DIN DB PENTRU CALCUL
// ─────────────────────────────────────────────────────────────────────────────

async function loadProjectData(projectId, ownerId, classId) {
  const configQ = await pool.query(
    `SELECT * FROM project_scoring_config WHERE project_id = $1`,
    [projectId]
  );
  const cfg = configQ.rows[0] ?? {
    weight_node_create: 1.50, weight_edge_create: 1.25,
    weight_node_agree: 1.00, weight_edge_agree: 1.00,
    weight_node_disagree: 0.75, weight_edge_disagree: 0.75,
    penalty_undecided: 0.50,
  };

  const guestsQ = await pool.query(
    `SELECT sc.student_id AS id, u.name
     FROM stud_classes sc
     JOIN users u ON u.id = sc.student_id
     WHERE sc.class_id = $1`,
    [classId]
  );
  const guests = guestsQ.rows;

  const nodesQ = await pool.query(
    `SELECT n.id,
       cr.reviewer_id AS creator_id,
       CASE WHEN o.verdict = 'ENDORSE' THEN 'ACCEPTED'
            WHEN o.verdict = 'OPPOSE'  THEN 'REJECTED'
            ELSE 'PENDING' END AS owner_decision
     FROM v1nodes n
     JOIN v1nodereviews cr ON cr.node_id = n.id AND cr.verdict = 'CREATE'
     LEFT JOIN v1nodereviews o ON o.node_id = n.id AND o.reviewer_id = $2
     WHERE n.project_id = $1`,
    [projectId, ownerId]
  );
  const nodes = nodesQ.rows;

  const edgesQ = await pool.query(
    `SELECT e.id,
       cr.reviewer_id AS creator_id,
       CASE WHEN o.verdict = 'ENDORSE' THEN 'ACCEPTED'
            WHEN o.verdict = 'OPPOSE'  THEN 'REJECTED'
            ELSE 'PENDING' END AS owner_decision
     FROM v1edges e
     JOIN v1edgereviews cr ON cr.edge_id = e.id AND cr.verdict = 'CREATE'
     LEFT JOIN v1edgereviews o ON o.edge_id = e.id AND o.reviewer_id = $2
     WHERE e.project_id = $1`,
    [projectId, ownerId]
  );
  const edges = edgesQ.rows;

  const nodeReviewsQ = await pool.query(
    `SELECT nr.node_id, nr.reviewer_id, nr.verdict
     FROM v1nodereviews nr
     JOIN v1nodes n ON n.id = nr.node_id
     WHERE n.project_id = $1
       AND nr.verdict IN ('ENDORSE','OPPOSE')
       AND nr.reviewer_id <> $2`,
    [projectId, ownerId]
  );
  const nodeReviews = nodeReviewsQ.rows;

  const edgeReviewsQ = await pool.query(
    `SELECT er.edge_id, er.reviewer_id, er.verdict
     FROM v1edgereviews er
     JOIN v1edges e ON e.id = er.edge_id
     WHERE e.project_id = $1
       AND er.verdict IN ('ENDORSE','OPPOSE')
       AND er.reviewer_id <> $2`,
    [projectId, ownerId]
  );
  const edgeReviews = edgeReviewsQ.rows;

  return { cfg, guests, nodes, edges, nodeReviews, edgeReviews };
}

// ─────────────────────────────────────────────────────────────────────────────
// INSERARE SCORURI ÎN DB
// ─────────────────────────────────────────────────────────────────────────────

async function insertScores(client, sessionId, scores) {
  for (const s of scores) {
    await client.query(
      `INSERT INTO session_scores (
         session_id, user_id,
         trust_factor, performance_pct,
         nodes_created, nodes_created_accepted, nodes_created_rejected, nodes_created_pending,
         edges_created, edges_created_accepted, edges_created_rejected, edges_created_pending,
         nodes_agreed, nodes_agreed_correct, nodes_agreed_wrong, nodes_agreed_pending,
         edges_agreed, edges_agreed_correct, edges_agreed_wrong, edges_agreed_pending,
         nodes_disagreed, nodes_disagreed_correct, nodes_disagreed_wrong,
         edges_disagreed, edges_disagreed_correct, edges_disagreed_wrong,
         nodes_undecided, edges_undecided,
         personality_tags, rewards_breakdown, penalties_breakdown
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
       )`,
      [
        sessionId, s.user_id,
        s.trust_factor, s.performance_pct,
        s.nodes_created, s.nodes_created_accepted, s.nodes_created_rejected, s.nodes_created_pending,
        s.edges_created, s.edges_created_accepted, s.edges_created_rejected, s.edges_created_pending,
        s.nodes_agreed, s.nodes_agreed_correct, s.nodes_agreed_wrong, s.nodes_agreed_pending,
        s.edges_agreed, s.edges_agreed_correct, s.edges_agreed_wrong, s.edges_agreed_pending,
        s.nodes_disagreed, s.nodes_disagreed_correct, s.nodes_disagreed_wrong,
        s.edges_disagreed, s.edges_disagreed_correct, s.edges_disagreed_wrong,
        s.nodes_undecided, s.edges_undecided,
        JSON.stringify(s.personality_tags),
        JSON.stringify(s.rewards_breakdown),
        JSON.stringify(s.penalties_breakdown),
      ]
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getScoringConfig(req, res) {
  const { projectId } = req.params;
  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const { rows } = await pool.query(
    `SELECT * FROM project_scoring_config WHERE project_id = $1`,
    [projectId]
  );

  const config = rows[0] ?? {
    project_id: projectId,
    weight_node_create: 1.50, weight_edge_create: 1.25,
    weight_node_agree: 1.00, weight_edge_agree: 1.00,
    weight_node_disagree: 0.75, weight_edge_disagree: 0.75,
    penalty_undecided: 0.50,
  };

  return res.json({ success: true, config });
}

export async function upsertScoringConfig(req, res) {
  const { projectId } = req.params;
  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");
  if (pr.owner_id !== req.user.id) return httpErr(res, 403, "OwnerOnly");

  const {
    weight_node_create = 1.50, weight_edge_create = 1.25,
    weight_node_agree = 1.00, weight_edge_agree = 1.00,
    weight_node_disagree = 0.75, weight_edge_disagree = 0.75,
    penalty_undecided = 0.50,
  } = req.body || {};

  const { rows } = await pool.query(
    `INSERT INTO project_scoring_config (
       project_id,
       weight_node_create, weight_edge_create,
       weight_node_agree, weight_edge_agree,
       weight_node_disagree, weight_edge_disagree,
       penalty_undecided, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (project_id) DO UPDATE SET
       weight_node_create   = EXCLUDED.weight_node_create,
       weight_edge_create   = EXCLUDED.weight_edge_create,
       weight_node_agree    = EXCLUDED.weight_node_agree,
       weight_edge_agree    = EXCLUDED.weight_edge_agree,
       weight_node_disagree = EXCLUDED.weight_node_disagree,
       weight_edge_disagree = EXCLUDED.weight_edge_disagree,
       penalty_undecided    = EXCLUDED.penalty_undecided,
       updated_at           = now()
     RETURNING *`,
    [projectId, weight_node_create, weight_edge_create,
     weight_node_agree, weight_edge_agree,
     weight_node_disagree, weight_edge_disagree,
     penalty_undecided]
  );

  return res.json({ success: true, config: rows[0] });
}

export async function getPerformanceSessions(req, res) {
  const { projectId } = req.params;
  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const { rows: sessions } = await pool.query(
    `SELECT ps.id, ps.label, ps.created_at, ps.created_by,
            COUNT(ss.id) AS scored_users
     FROM performance_sessions ps
     LEFT JOIN session_scores ss ON ss.session_id = ps.id
     WHERE ps.project_id = $1
     GROUP BY ps.id
     ORDER BY ps.created_at DESC`,
    [projectId]
  );

  return res.json({ success: true, sessions });
}

export async function getSessionScores(req, res) {
  const { projectId, sessionId } = req.params;
  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const { rows: scores } = await pool.query(
    `SELECT ss.*, u.name AS user_name
     FROM session_scores ss
     JOIN users u ON u.id = ss.user_id
     WHERE ss.session_id = $1
     ORDER BY ss.performance_pct DESC`,
    [sessionId]
  );

  return res.json({ success: true, scores });
}

export async function createPerformanceSession(req, res) {
  const { projectId } = req.params;
  const { label } = req.body || {};
  const ownerId = req.user.id;

  const pr = await getProjectAuth(projectId, ownerId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");
  if (pr.owner_id !== ownerId) return httpErr(res, 403, "OwnerOnly");
  if (!pr.class_id) return httpErr(res, 400, "Project not linked to a class");

  const { cfg, guests, nodes, edges, nodeReviews, edgeReviews } =
    await loadProjectData(projectId, ownerId, pr.class_id);

  if (!guests.length) return httpErr(res, 400, "No students in this class");

  const scores = guests.map(guest =>
    computeGuestScore(guest, nodes, edges, nodeReviews, edgeReviews, cfg, ownerId)
  );

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    const sessionIns = await c.query(
      `INSERT INTO performance_sessions (project_id, created_by, label)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, created_by, created_at, label`,
      [projectId, ownerId, label ?? null]
    );
    const session = sessionIns.rows[0];

    await insertScores(c, session.id, scores);

    await c.query("COMMIT");

    return res.status(201).json({
      success: true,
      session,
      scores: scores.map(s => ({
        user_id: s.user_id,
        user_name: s.user_name,
        trust_factor: s.trust_factor,
        performance_pct: s.performance_pct,
        personality_tags: s.personality_tags,
        rewards_breakdown: s.rewards_breakdown,
        penalties_breakdown: s.penalties_breakdown,
      })),
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("createPerformanceSession failed", e);
    return httpErr(res, 500, e?.message || "Server error");
  } finally {
    c.release();
  }
}

export async function recalculateSession(req, res) {
  const { projectId, sessionId } = req.params;
  const ownerId = req.user.id;

  const pr = await getProjectAuth(projectId, ownerId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");
  if (pr.owner_id !== ownerId) return httpErr(res, 403, "OwnerOnly");
  if (!pr.class_id) return httpErr(res, 400, "Project not linked to a class");

  const sessionQ = await pool.query(
    `SELECT id FROM performance_sessions WHERE id = $1 AND project_id = $2`,
    [sessionId, projectId]
  );
  if (!sessionQ.rows[0]) return httpErr(res, 404, "Session not found");

  const { cfg, guests, nodes, edges, nodeReviews, edgeReviews } =
    await loadProjectData(projectId, ownerId, pr.class_id);

  if (!guests.length) return httpErr(res, 400, "No students in this class");

  const scores = guests.map(guest =>
    computeGuestScore(guest, nodes, edges, nodeReviews, edgeReviews, cfg, ownerId)
  );

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(`DELETE FROM session_scores WHERE session_id = $1`, [sessionId]);
    await insertScores(c, sessionId, scores);
    await c.query("COMMIT");

    return res.json({
      success: true,
      scores: scores.map(s => ({
        user_id: s.user_id,
        user_name: s.user_name,
        trust_factor: s.trust_factor,
        performance_pct: s.performance_pct,
        personality_tags: s.personality_tags,
        rewards_breakdown: s.rewards_breakdown,
        penalties_breakdown: s.penalties_breakdown,
      })),
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("recalculateSession failed", e);
    return httpErr(res, 500, e?.message || "Server error");
  } finally {
    c.release();
  }
}

export async function setProjectLocked(req, res) {
  const { projectId } = req.params;
  const { locked } = req.body || {};

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");
  if (pr.owner_id !== req.user.id) return httpErr(res, 403, "OwnerOnly");

  await pool.query(
    `UPDATE projects SET is_locked = $1 WHERE id = $2`,
    [!!locked, projectId]
  );

  return res.json({ success: true, is_locked: !!locked });
}