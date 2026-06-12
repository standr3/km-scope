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
// GET /sessions — lista sesiuni per proiect
// ─────────────────────────────────────────────────────────────────────────────

export async function getPerformanceSessions(req, res) {
  const { projectId } = req.params;

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const { rows } = await pool.query(
    `SELECT ps.id, ps.label, ps.created_at, ps.created_by,
            COUNT(ss.id)::int AS scored_users
     FROM performance_sessions ps
     LEFT JOIN session_scores ss ON ss.session_id = ps.id
     WHERE ps.project_id = $1
     GROUP BY ps.id
     ORDER BY ps.created_at DESC`,
    [projectId]
  );

  return res.json({ success: true, sessions: rows });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /sessions/:sessionId/scores — scorurile unei sesiuni
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionScores(req, res) {
  const { projectId, sessionId } = req.params;

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const { rows } = await pool.query(
    `SELECT ss.*
     FROM session_scores ss
     JOIN performance_sessions ps ON ps.id = ss.session_id
     WHERE ss.session_id = $1 AND ps.project_id = $2
     ORDER BY ss.performance_pct DESC`,
    [sessionId, projectId]
  );

  return res.json({ success: true, scores: rows });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /sessions — salvează o sesiune nouă (trimisă din frontend)
// ─────────────────────────────────────────────────────────────────────────────

export async function createPerformanceSession(req, res) {
  const { projectId } = req.params;
  const { label, scores } = req.body || {};
  const ownerId = req.user.id;

  const pr = await getProjectAuth(projectId, ownerId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");
  if (pr.owner_id !== ownerId) return httpErr(res, 403, "OwnerOnly");

  if (!Array.isArray(scores) || scores.length === 0) {
    return httpErr(res, 400, "Missing scores");
  }

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

    for (const s of scores) {
      await c.query(
        `INSERT INTO session_scores (
           session_id, user_id, guest_name,
           trust_factor, performance_pct, raw_score,
           nodes_created, nodes_created_accepted, nodes_created_rejected,
           edges_created, edges_created_accepted, edges_created_rejected,
           nodes_agreed, nodes_agreed_correct, nodes_agreed_wrong,
           edges_agreed, edges_agreed_correct, edges_agreed_wrong,
           nodes_disagreed, nodes_disagreed_correct, nodes_disagreed_wrong,
           edges_disagreed, edges_disagreed_correct, edges_disagreed_wrong,
           nodes_undecided, edges_undecided,
           tags, rewards, penalties
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
           $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
         )`,
        [
          session.id,
          s.guestId,
          s.guestName,
          s.trustFactor,
          s.performancePct,
          s.rawScore,
          s.nodesCreated,
          s.nodesCreatedAccepted,
          s.nodesCreatedRejected,
          s.edgesCreated,
          s.edgesCreatedAccepted,
          s.edgesCreatedRejected,
          s.nodesAgreed,
          s.nodesAgreedCorrect,
          s.nodesAgreedWrong,
          s.edgesAgreed,
          s.edgesAgreedCorrect,
          s.edgesAgreedWrong,
          s.nodesDisagreed,
          s.nodesDisagreedCorrect,
          s.nodesDisagreedWrong,
          s.edgesDisagreed,
          s.edgesDisagreedCorrect,
          s.edgesDisagreedWrong,
          s.nodesUndecided,
          s.edgesUndecided,
          JSON.stringify(s.tags ?? []),
          JSON.stringify(s.rewards ?? []),
          JSON.stringify(s.penalties ?? []),
        ]
      );
    }

    await c.query("COMMIT");
    return res.status(201).json({ success: true, session });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("createPerformanceSession failed", e);
    return httpErr(res, 500, e?.message || "Server error");
  } finally {
    c.release();
  }
}