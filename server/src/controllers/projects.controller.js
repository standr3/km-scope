import pool from "../db/pool.js";

function SERVER_CONSOLE_LOGGER(data) {
  console.log(data);
}

export async function getProject(req, res) {
  const { projectId } = req.params;
  // teacher can see only own class; student can see only enrolled
  const projectQ = await pool.query("SELECT * FROM projects WHERE id=$1", [
    projectId,
  ]);
  const project = projectQ.rows[0];
  if (!project)
    return res.status(404).json({ success: false, message: "Not found" });

  return res.json({ success: true, project });
}

export async function getProjectWithMembers(req, res) {
  // console.log("getProjectWithMembers");
  const { projectId } = req.params;

  try {
    const projectQ = await pool.query("SELECT * FROM projects WHERE id=$1", [
      projectId,
    ]);
    const project = projectQ.rows[0];

    if (!project) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Members: OWNER + TEACHER (+ STUDENTS)
    const membersQ = await pool.query(
      `
      WITH c AS (
        SELECT id, teacher_id
        FROM classes
        WHERE id = $1
      ),
      members AS (
        -- owner
        SELECT $2::uuid AS user_id, 'OWNER'::text AS role
        UNION ALL
        -- teacher (may be null)
        SELECT teacher_id AS user_id, 'TEACHER'::text AS role
        FROM c
        UNION ALL
        -- students
        SELECT sc.student_id AS user_id, 'STUDENT'::text AS role
        FROM stud_classes sc
        WHERE sc.class_id = $1
      )
      SELECT DISTINCT ON (u.id)
        u.id,
        u.name,
        m.role
      FROM members m
      JOIN users u ON u.id = m.user_id
      WHERE m.user_id IS NOT NULL
      ORDER BY u.id, 
        CASE m.role 
          WHEN 'OWNER' THEN 1
          WHEN 'TEACHER' THEN 2
          WHEN 'STUDENT' THEN 3
          ELSE 99
        END
      `,
      [project.class_id, project.owner_id],
    );

    const members = membersQ.rows;

    return res.json({ success: true, project: { ...project, members } });
  } catch (err) {
    SERVER_CONSOLE_LOGGER(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function listClassProjects(req, res) {
  const { classId } = req.params;
  // teacher can see only own class; student can see only enrolled
  if (req.roles?.includes("teacher")) {
    const q = await pool.query(
      "SELECT 1 FROM classes WHERE id=$1 AND teacher_id=$2",
      [classId, req.user.id],
    );
    if (!q.rows[0])
      return res.status(403).json({ success: false, message: "Forbidden" });
  } else {
    const q = await pool.query(
      "SELECT 1 FROM stud_classes WHERE class_id=$1 AND student_id=$2",
      [classId, req.user.id],
    );
    if (!q.rows[0])
      return res.status(403).json({ success: false, message: "Forbidden" });
  }
  const { rows } = await pool.query(
    "SELECT * FROM projects WHERE class_id=$1 ORDER BY created_at DESC",
    [classId],
  );
  return res.json({ success: true, projects: rows });
}

export async function createProject(req, res) {
  const { classId } = req.params;
  const { name } = req.body || {};
  if (!name)
    return res.status(400).json({ success: false, message: "Missing name" });

  const c = await pool.query(
    "SELECT id FROM classes WHERE id=$1 AND teacher_id=$2",
    [classId, req.user.id],
  );
  if (!c.rows[0])
    return res.status(403).json({ success: false, message: "Forbidden" });

  const pr = await pool.query(
    "INSERT INTO projects (class_id, name, owner_id) VALUES ($1,$2,$3) RETURNING *",
    [classId, name, req.user.id],
  );

  // create branches for all enrolled students
  // await pool.query(
  //   `INSERT INTO branches (project_id, user_id)
  //    SELECT $1, sc.student_id FROM stud_classes sc WHERE sc.class_id=$2
  //    ON CONFLICT DO NOTHING`,
  //   [pr.rows[0].id, classId]
  // );

  return res.status(201).json({ success: true, project: pr.rows[0] });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const owner = await pool.query(
    `SELECT p.id FROM projects p
     JOIN classes c ON c.id=p.class_id
     WHERE p.id=$1 AND c.teacher_id=$2`,
    [id, req.user.id],
  );
  if (!owner.rows[0])
    return res.status(403).json({ success: false, message: "Forbidden" });

  const { name } = req.body || {};
  const { rows } = await pool.query(
    "UPDATE projects SET name=COALESCE($1,name) WHERE id=$2 RETURNING *",
    [name ?? null, id],
  );
  return res.json({ success: true, project: rows[0] });
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  const owner = await pool.query(
    `SELECT p.id FROM projects p
     JOIN classes c ON c.id=p.class_id
     WHERE p.id=$1 AND c.teacher_id=$2`,
    [id, req.user.id],
  );
  if (!owner.rows[0])
    return res.status(403).json({ success: false, message: "Forbidden" });

  await pool.query("DELETE FROM projects WHERE id=$1", [id]); // cascades branches
  return res.json({ success: true });
}

function httpErr(res, code, message) {
  return res.status(code).json({ success: false, message });
}

async function getProjectAuth(projectId, userId) {
  // Owner proiect sau profesorul clasei, sau student înscris în clasa proiectului
  const q = await pool.query(
    `
    SELECT p.id, p.owner_id, p.class_id, c.teacher_id
    FROM projects p
    LEFT JOIN classes c ON c.id = p.class_id
    WHERE p.id = $1
    `,
    [projectId],
  );
  const pr = q.rows[0];
  if (!pr) return null;

  let canAccess = false;

  if (pr.owner_id === userId) canAccess = true;
  else if (pr.teacher_id && pr.teacher_id === userId) canAccess = true;
  else if (pr.class_id) {
    const sc = await pool.query(
      "SELECT 1 FROM stud_classes WHERE class_id=$1 AND student_id=$2 LIMIT 1",
      [pr.class_id, userId],
    );
    if (sc.rows[0]) canAccess = true;
  }
  return canAccess ? pr : { denied: true };
}

// GET /api/project/:projectId/nodes
export async function getNodes(req, res) {
  // console.log("getNodes");
  const { projectId } = req.params;

  const projectReq = await getProjectAuth(projectId, req.user.id);

  if (!projectReq) return httpErr(res, 404, "Not found");
  if (projectReq.denied) return httpErr(res, 403, "Forbidden");

  const { rows } = await pool.query(
    `
    SELECT
      n.id,
      n.project_id,
      n.label,

      cr.reviewer_id AS creator_id,

      EXISTS (
        SELECT 1
        FROM v1nodereviews del
        WHERE del.node_id = n.id
          AND del.reviewer_id = cr.reviewer_id
          AND del.verdict = 'DELETE'
      ) AS abandoned,

      CASE o.verdict
        WHEN 'ENDORSE'  THEN 'APPROVED'
        WHEN 'OPPOSE'   THEN 'REJECTED'
        WHEN 'CREATE'   THEN 'BASELINE'
        WHEN 'POSTPONE' THEN 'POSTPONED'
        ELSE NULL
      END AS owner_review,

      COALESCE(l.liked_by, ARRAY[]::uuid[])     AS liked_by,
      COALESCE(d.disliked_by, ARRAY[]::uuid[]) AS disliked_by

    FROM v1nodes n
    JOIN projects p
      ON p.id = n.project_id

    -- creator = review-ul CREATE
    JOIN v1nodereviews cr
      ON cr.node_id = n.id
     AND cr.verdict = 'CREATE'

    -- review-ul ownerului
    LEFT JOIN v1nodereviews o
      ON o.node_id = n.id
     AND o.reviewer_id = p.owner_id

    -- ENDORSE (exclus owner)
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(DISTINCT r.reviewer_id) AS liked_by
      FROM v1nodereviews r
      WHERE r.node_id = n.id
        AND r.verdict = 'ENDORSE'
        AND r.reviewer_id <> p.owner_id
    ) l ON true

    -- OPPOSE (exclus owner)
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(DISTINCT r.reviewer_id) AS disliked_by
      FROM v1nodereviews r
      WHERE r.node_id = n.id
        AND r.verdict = 'OPPOSE'
        AND r.reviewer_id <> p.owner_id
    ) d ON true

    WHERE n.project_id = $1
  `,
    // [projectId, req.user.id],
    [projectId],
  );
  // console.log("rows: " + JSON.stringify(rows));

  // output exact pe modelul cerut
  const nodes = rows.map((r) => ({
    id: r.id,
    label: r.label,

    creator_id: r.creator_id,
    abandoned: r.abandoned,

    owner_review: r.owner_review ?? null,

    liked_by: r.liked_by ?? [],
    disliked_by: r.disliked_by ?? [],
  }));

  return res.json({ success: true, nodes });
}

// GET /api/project/:projectId/nodes
// export async function getProjectNodes(req, res) {
//   const { projectId } = req.params;

//   const projectReq = await getProjectAuth(projectId, req.user.id);

//   if (!projectReq) return httpErr(res, 404, "Not found");
//   if (projectReq.denied) return httpErr(res, 403, "Forbidden");

//   // Join nodes -> users ca să primești numele creatorului în același răspuns
//   // Left join ca să nu pice dacă, din orice motiv, userul lipsește (defensiv)
//   const { rows } = await pool.query(
//     `
//   SELECT
//     n.id,
//     n.project_id,
//     n.label,
//     n.creator_id,
//     n.owner_decision,

//     u.name  AS creator_name,
//     u.email AS creator_email,

//     -- verdictul userului curent pe acest nod (sau NULL)
//     nr_my.verdict AS my_review_verdict,

//     -- counters (fara CREATED)
//     COALESCE(rv.positive_count, 0) AS positive_count,
//     COALESCE(rv.negative_count, 0) AS negative_count,
//     COALESCE(rv.review_total, 0)   AS review_total,

//     -- approval rate in procente (0..100)
//     COALESCE(rv.approval_rate_pct, 0) AS approval_rate_pct

//   FROM nodes n

//   LEFT JOIN users u
//     ON u.id = n.creator_id

//   LEFT JOIN node_reviews nr_my
//     ON nr_my.node_id = n.id
//    AND nr_my.reviewer_id = $2

//   LEFT JOIN (
//     SELECT
//       node_id,
//       COUNT(*) FILTER (WHERE verdict = 'POSITIVE') AS positive_count,
//       COUNT(*) FILTER (WHERE verdict = 'NEGATIVE') AS negative_count,
//       COUNT(*) FILTER (WHERE verdict IN ('POSITIVE','NEGATIVE')) AS review_total,
//       ROUND(
//         100.0 * COUNT(*) FILTER (WHERE verdict = 'POSITIVE')
//         / NULLIF(COUNT(*) FILTER (WHERE verdict IN ('POSITIVE','NEGATIVE')), 0)
//       , 2) AS approval_rate_pct
//     FROM node_reviews
//     WHERE verdict IN ('POSITIVE','NEGATIVE')  -- excludem CREATED din calcule
//     GROUP BY node_id
//   ) rv
//     ON rv.node_id = n.id

//   WHERE n.project_id = $1
//     AND n.deleted_at IS NULL

//   ORDER BY n.id ASC
//   `,
//     [projectId, req.user.id],
//   );

//   // Shape ergonomic pentru frontend: creator ca obiect
//   const nodes = rows.map((r) => ({
//     id: r.id,
//     projectId: r.project_id,
//     label: r.label,
//     ownerDecision: r.owner_decision,
//     creator: {
//       id: r.creator_id,
//       name: r.creator_name ?? null,
//       email: r.creator_email ?? null,
//     },
//     my_review_verdict: r.my_review_verdict ?? null,

//     reviews: {
//       positive: Number(r.positive_count ?? 0),
//       negative: Number(r.negative_count ?? 0),
//       total: Number(r.review_total ?? 0),
//       approvalRatePct: Number(r.approval_rate_pct ?? 0),
//     },
//   }));

//   return res.json({ success: true, nodes });
// }

// POST /api/project/:projectId/nodes
export async function createNode(req, res) {
  const { projectId } = req.params;
  const { label } = req.body || {};
  console.log("create node " + label);

  if (!label || typeof label !== "string")
    return httpErr(res, 400, "Missing label");

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    
    const nodeIns = await c.query(
      `INSERT INTO v1nodes (project_id, label)
       VALUES ($1, $2)
       RETURNING id, project_id, label`,
      [projectId, label.trim()],
    );

    const node = nodeIns.rows[0];

    await c.query(
      `INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
       VALUES ($1, $2, $3)`,
      [node.id, req.user.id, "CREATE"],
    );

    await c.query("COMMIT");
    return res.status(201).json({ success: true, node });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    return httpErr(res, 500, e?.message || "Server error");
  } finally {
    c.release();
  }
}

// POST /api/project/:projectId/nodes
export async function createProjectNode(req, res) {
  const { projectId } = req.params;
  const { label } = req.body || {};

  if (!label || typeof label !== "string")
    return httpErr(res, 400, "Missing label");

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  let default_decision = "PENDING";
  if (pr.owner_id === req.user.id) default_decision = "ACCEPTED";

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    const nodeIns = await c.query(
      `INSERT INTO nodes (project_id, label, creator_id, owner_decision)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, label, creator_id, owner_decision, deleted_at, deleted_by`,
      [projectId, label.trim(), req.user.id, default_decision],
    );

    const node = nodeIns.rows[0];

    // Auto-review CREATED (audit)
    await c.query(
      `INSERT INTO node_reviews (node_id, reviewer_id, verdict)
       VALUES ($1, $2, $3)
       ON CONFLICT (node_id, reviewer_id) DO NOTHING`,
      [node.id, req.user.id, "CREATED"],
    );

    await c.query("COMMIT");
    return res.status(201).json({ success: true, node });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    return httpErr(res, 500, e?.message || "Server error");
  } finally {
    c.release();
  }
}

// DELETE /api/project/:projectId/nodes/:nodeId
export async function deleteProjectNode(req, res) {
  const { projectId, nodeId } = req.params;

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const userId = req.user.id;
  const ownerId = pr.owner_id;
  const isOwner = userId === ownerId;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // 1) lock node row (prevents concurrent delete / concurrent checks)
    const nodeFound = await c.query(
      `SELECT id
         FROM v1nodes
        WHERE id = $1 AND project_id = $2
        FOR UPDATE`,
      [nodeId, projectId],
    );

    if (!nodeFound.rows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Node not found");
    }

    // 2) Gather facts from reviews, under lock-ish (same tx; node locked)
    //    - must be created by current user (CREATE exists)
    //    - must not be already abandoned by current user (DELETE exists)
    const myCreate = await c.query(
      `SELECT 1
         FROM v1nodereviews
        WHERE node_id = $1 AND reviewer_id = $2 AND verdict = 'CREATE'
        LIMIT 1`,
      [nodeId, userId],
    );

    if (!myCreate.rows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 403, "Cannot delete: node not created by you");
    }

    const myDelete = await c.query(
      `SELECT 1
         FROM v1nodereviews
        WHERE node_id = $1 AND reviewer_id = $2 AND verdict = 'DELETE'
        LIMIT 1`,
      [nodeId, userId],
    );

    if (myDelete.rows[0]) {
      await c.query("ROLLBACK");
      return httpErr(
        res,
        409,
        "Cannot delete: node already abandoned (soft-deleted) by you",
      );
    }

    if (!isOwner) {
      // GUEST RULES:

      // (a) Owner must NOT have any review on this node (no interaction from owner yet)
      //     If you want to allow owner's CREATE to count, change this query accordingly,
      //     but for guest nodes it should be "no rows at all".
      const ownerAnyReview = await c.query(
        `SELECT 1
           FROM v1nodereviews
          WHERE node_id = $1 AND reviewer_id = $2
          LIMIT 1`,
        [nodeId, ownerId],
      );

      if (ownerAnyReview.rows[0]) {
        await c.query("ROLLBACK");
        return httpErr(
          res,
          403,
          "Cannot delete: node already reviewed by owner",
        );
      }

      // (b) Decide hard vs soft:
      //     - if there are reviews from other guests => SOFT (insert DELETE review)
      //     - else => HARD (delete v1nodes row; cascades v1nodereviews)
      const otherGuestReviews = await c.query(
        `SELECT 1
           FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id <> $2
            AND reviewer_id <> $3
          LIMIT 1`,
        [nodeId, userId, ownerId],
      );

      if (otherGuestReviews.rows[0]) {
        // SOFT DELETE: insert DELETE verdict for current user
        await c.query(
          `INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
           VALUES ($1, $2, 'DELETE')`,
          [nodeId, userId],
        );

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          deletedId: nodeId,
          mode: "soft",
        });
      }

      // HARD DELETE: no other guest reviews exist
      const del = await c.query(
        `DELETE FROM v1nodes
          WHERE id = $1 AND project_id = $2
          RETURNING id`,
        [nodeId, projectId],
      );

      if (!del.rows[0]) {
        await c.query("ROLLBACK");
        return httpErr(res, 404, "Node not found");
      }

      await c.query("COMMIT");
      return res.status(200).json({
        success: true,
        deletedId: del.rows[0].id,
        mode: "hard",
      });
    }

    // OWNER RULES:
    // - Owner can delete only nodes created by him (already ensured by myCreate above)
    // - Always HARD delete (no propagation logic here)
    const del = await c.query(
      `DELETE FROM v1nodes
        WHERE id = $1 AND project_id = $2
        RETURNING id`,
      [nodeId, projectId],
    );

    if (!del.rows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Node not found");
    }

    await c.query("COMMIT");
    return res.status(200).json({
      success: true,
      deletedId: del.rows[0].id,
      mode: "hard",
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("deleteV1ProjectNode failed", {
      code: e.code,
      message: e.message,
      detail: e.detail,
      constraint: e.constraint,
      table: e.table,
    });
    return httpErr(res, 500, "Server error");
  } finally {
    c.release();
  }
}

// PATCH /api/project/:projectId/nodes/:nodeId/review
export async function upsertNodeReview(req, res) {
  const { projectId, nodeId } = req.params;
  const { verdict } = req.body || {}; // 'ENDORSE' | 'OPPOSE' | null
  const actorId = req.user.id;

  const pr = await getProjectAuth(projectId, actorId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const ownerId = pr.owner_id;
  const isOwner = actorId === ownerId;
  const isUndo = verdict == null;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // 0) node exists in project?
    const { rows: nrows } = await c.query(
      `SELECT id FROM v1nodes WHERE id = $1 AND project_id = $2`,
      [nodeId, projectId],
    );
    if (!nrows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Node not found");
    }

    // helpers ------------------------------------------------------------

    const getNodeCreatorId = async () => {
      const { rows } = await c.query(
        `
        SELECT reviewer_id AS creator_id
        FROM v1nodereviews
        WHERE node_id = $1 AND verdict = 'CREATE'::v1verdict
        ORDER BY id ASC
        LIMIT 1
        `,
        [nodeId],
      );
      return rows[0]?.creator_id ?? null;
    };

    const hasOwnerNodeDecision = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
        ) AS ok
        `,
        [nodeId, ownerId],
      );
      return Boolean(rows[0]?.ok);
    };

    const getActorNodeDecision = async () => {
      const { rows } = await c.query(
        `
        SELECT id, verdict
        FROM v1nodereviews
        WHERE node_id = $1
          AND reviewer_id = $2
          AND verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
        ORDER BY id DESC
        LIMIT 1
        `,
        [nodeId, actorId],
      );
      return rows[0] ?? null; // {id, verdict}
    };

    const actorHasNodeCreate = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict = 'CREATE'::v1verdict
        ) AS ok
        `,
        [nodeId, actorId],
      );
      return Boolean(rows[0]?.ok);
    };

    const actorHasNodeDelete = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict = 'DELETE'::v1verdict
        ) AS ok
        `,
        [nodeId, actorId],
      );
      return Boolean(rows[0]?.ok);
    };

    // “support” rule used in edge cleanups:
    // supported(user) := user ENDORSE on node OR (user CREATE on node AND NOT user DELETE on node)
    const getSupportedUserIdsForNode = async () => {
      const { rows } = await c.query(
        `
        WITH endorsed AS (
          SELECT DISTINCT reviewer_id
          FROM v1nodereviews
          WHERE node_id = $1 AND verdict = 'ENDORSE'::v1verdict
        ),
        created_active AS (
          SELECT DISTINCT c.reviewer_id
          FROM v1nodereviews c
          WHERE c.node_id = $1 AND c.verdict = 'CREATE'::v1verdict
            AND NOT EXISTS (
              SELECT 1
              FROM v1nodereviews d
              WHERE d.node_id = c.node_id
                AND d.reviewer_id = c.reviewer_id
                AND d.verdict = 'DELETE'::v1verdict
            )
        )
        SELECT reviewer_id FROM endorsed
        UNION
        SELECT reviewer_id FROM created_active
        `,
        [nodeId],
      );
      return rows.map((r) => r.reviewer_id);
    };

    // adjacent edges + edge creator + owner/actor flags in one go
    const loadAdjacentEdgesInfo = async () => {
      const { rows } = await c.query(
        `
        WITH adj AS (
          SELECT e.id
          FROM v1edges e
          WHERE e.project_id = $1
            AND (e.source_id = $2 OR e.target_id = $2)
        ),
        edge_creator AS (
          SELECT DISTINCT ON (r.edge_id)
                 r.edge_id,
                 r.reviewer_id AS creator_id
          FROM v1edgereviews r
          WHERE r.edge_id IN (SELECT id FROM adj)
            AND r.verdict = 'CREATE'::v1verdict
          ORDER BY r.edge_id, r.id ASC
        )
        SELECT
          a.id AS edge_id,
          ec.creator_id,
          (ec.creator_id = $3)::boolean AS is_owner_created,
          (ec.creator_id = $4)::boolean AS is_actor_created,

          -- owner decision-like present? (ENDORSE/OPPOSE/POSTPONE)
          EXISTS (
            SELECT 1 FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id = $3
              AND r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
          ) AS has_owner_decision,

          -- owner endorse present?
          EXISTS (
            SELECT 1 FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id = $3
              AND r.verdict = 'ENDORSE'::v1verdict
          ) AS has_owner_endorse,

          -- actor endorse present?
          EXISTS (
            SELECT 1 FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id = $4
              AND r.verdict = 'ENDORSE'::v1verdict
          ) AS has_actor_endorse,

          -- actor oppose present?
          EXISTS (
            SELECT 1 FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id = $4
              AND r.verdict = 'OPPOSE'::v1verdict
          ) AS has_actor_oppose,

          -- actor delete present?
          EXISTS (
            SELECT 1 FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id = $4
              AND r.verdict = 'DELETE'::v1verdict
          ) AS has_actor_delete,

          -- count of decision-like reviews by guests (ENDORSE/OPPOSE/POSTPONE) excluding owner
          (
            SELECT COUNT(*)
            FROM v1edgereviews r
            WHERE r.edge_id = a.id
              AND r.reviewer_id <> $3
              AND r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
          ) AS guest_decision_count
        FROM adj a
        LEFT JOIN edge_creator ec ON ec.edge_id = a.id
        `,
        [projectId, nodeId, ownerId, actorId],
      );
      return rows;
    };

    const deleteEdgesByIds = async (edgeIds) => {
      if (!edgeIds?.length) return 0;
      // relies on FK edge_id ON DELETE CASCADE in v1edgereviews; otherwise delete v1edgereviews first
      const { rowCount } = await c.query(
        `DELETE FROM v1edges WHERE id = ANY($1::uuid[])`,
        [edgeIds],
      );
      return rowCount;
    };

    const deleteOwnerEndorseOnEdges = async (edgeIds) => {
      if (!edgeIds?.length) return 0;
      const { rowCount } = await c.query(
        `
        DELETE FROM v1edgereviews
        WHERE edge_id = ANY($1::uuid[])
          AND reviewer_id = $2
          AND verdict = 'ENDORSE'::v1verdict
        `,
        [edgeIds, ownerId],
      );
      return rowCount;
    };

    // delete guest ENDORSE reviews on edges for guests that are NOT supported on node
    const deleteUnsupportedGuestEdgeEndorses = async (
      edgeIds,
      supportedUserIds,
    ) => {
      if (!edgeIds?.length) return 0;
      const supported = supportedUserIds ?? [];
      const { rowCount } = await c.query(
        `
        DELETE FROM v1edgereviews r
        WHERE r.edge_id = ANY($1::uuid[])
          AND r.verdict = 'ENDORSE'::v1verdict
          AND r.reviewer_id <> $2
          AND NOT (r.reviewer_id = ANY($3::uuid[]))
        `,
        [edgeIds, ownerId, supported],
      );
      return rowCount;
    };

    // delete edges where creator is guest and creator is NOT supported on node
    const deleteEdgesWithUnsupportedGuestCreator = async (
      edgeIds,
      supportedUserIds,
    ) => {
      if (!edgeIds?.length) return 0;
      const supported = supportedUserIds ?? [];
      const { rows } = await c.query(
        `
        WITH candidates AS (
          SELECT e.id
          FROM v1edges e
          WHERE e.id = ANY($1::uuid[])
        ),
        creator AS (
          SELECT DISTINCT ON (r.edge_id)
                 r.edge_id,
                 r.reviewer_id AS creator_id
          FROM v1edgereviews r
          WHERE r.edge_id IN (SELECT id FROM candidates)
            AND r.verdict = 'CREATE'::v1verdict
          ORDER BY r.edge_id, r.id ASC
        )
        SELECT c.edge_id
        FROM creator c
        WHERE c.creator_id <> $2
          AND NOT (c.creator_id = ANY($3::uuid[]))
        `,
        [edgeIds, ownerId, supported],
      );
      const toDelete = rows.map((r) => r.edge_id);
      return await deleteEdgesByIds(toDelete);
    };

    // delete edges that are left only with CREATE/DELETE from a guest (no ENDORSE/OPPOSE/POSTPONE by anyone)
    const deleteEdgesWithNoDecisionsLeft = async (edgeIds) => {
      if (!edgeIds?.length) return 0;
      const { rows } = await c.query(
        `
        WITH candidates AS (
          SELECT unnest($1::uuid[]) AS edge_id
        ),
        decision_count AS (
          SELECT r.edge_id, COUNT(*) AS cnt
          FROM v1edgereviews r
          JOIN candidates c ON c.edge_id = r.edge_id
          WHERE r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
          GROUP BY r.edge_id
        )
        SELECT c.edge_id
        FROM candidates c
        LEFT JOIN decision_count d ON d.edge_id = c.edge_id
        WHERE COALESCE(d.cnt, 0) = 0
        `,
        [edgeIds],
      );
      const toDelete = rows.map((r) => r.edge_id);
      return await deleteEdgesByIds(toDelete);
    };

    // guest-only: if edge created by actor and not deleted:
    // - if has other reviews => add DELETE
    // - else => delete edge
    const guestHandleOwnActiveCreatedEdgesOnUndoEndorse = async (adjInfo) => {
      const ownActive = adjInfo
        .filter((e) => e.is_actor_created && !e.has_actor_delete)
        .map((e) => e.edge_id);
      if (!ownActive.length) return { addedDeletes: 0, deletedEdges: 0 };

      // edges that have any other reviews besides actor CREATE?
      // (we treat "other reviews" as any review not (actor CREATE))
      const { rows } = await c.query(
        `
        WITH candidates AS (
          SELECT unnest($1::uuid[]) AS edge_id
        ),
        has_other AS (
          SELECT c.edge_id,
                 EXISTS (
                   SELECT 1
                   FROM v1edgereviews r
                   WHERE r.edge_id = c.edge_id
                     AND NOT (r.reviewer_id = $2 AND r.verdict = 'CREATE'::v1verdict)
                 ) AS has_other_reviews
          FROM candidates c
        )
        SELECT edge_id, has_other_reviews
        FROM has_other
        `,
        [ownActive, actorId],
      );

      const needDeleteReview = rows
        .filter((r) => r.has_other_reviews)
        .map((r) => r.edge_id);
      const canHardDelete = rows
        .filter((r) => !r.has_other_reviews)
        .map((r) => r.edge_id);

      let addedDeletes = 0;
      if (needDeleteReview.length) {
        const r = await c.query(
          `
          INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
          SELECT unnest($1::uuid[]), $2, 'DELETE'::v1verdict
          ON CONFLICT DO NOTHING
          `,
          [needDeleteReview, actorId],
        );
        addedDeletes = r.rowCount || 0;
      }

      const deletedEdges = await deleteEdgesByIds(canHardDelete);
      return { addedDeletes, deletedEdges };
    };

    // common: delete owner-created adjacent edges (and their reviews)
    const ownerDeleteOwnerCreatedAdjacentEdges = async (adjInfo) => {
      const ownerCreated = adjInfo
        .filter((e) => e.is_owner_created)
        .map((e) => e.edge_id);
      const deleted = await deleteEdgesByIds(ownerCreated);
      return { deleted, ownerCreated };
    };

    // ---------------------------------------------------------------------
    // Load core state
    // ---------------------------------------------------------------------
    const nodeCreatorId = await getNodeCreatorId();
    if (!nodeCreatorId) {
      await c.query("ROLLBACK");
      return httpErr(res, 409, "NodeMissingCreator");
    }

    const actorDecision = await getActorNodeDecision(); // owner/guest decision-like (ENDORSE/OPPOSE/POSTPONE)
    const actorDecisionVerdict = actorDecision?.verdict ?? null;

    // ---------------------------------------------------------------------
    // ROLE PRECHECKS
    // ---------------------------------------------------------------------
    if (isOwner) {
      // node must not have CREATE by actor
      if (await actorHasNodeCreate()) {
        await c.query("ROLLBACK");
        return httpErr(res, 409, "OwnerCannotReviewOwnCreatedNode");
      }
    } else {
      // guest: node must not have owner decision
      const hasOwner = await hasOwnerNodeDecision();
      if (hasOwner) {
        await c.query("ROLLBACK");
        return httpErr(res, 409, "OwnerDecisionAlreadySet");
      }

      // and (no CREATE by actor) OR (has CREATE and has DELETE)
      const hasCreate = await actorHasNodeCreate();
      const hasDelete = await actorHasNodeDelete();
      if (hasCreate && !hasDelete) {
        await c.query("ROLLBACK");
        return httpErr(res, 403, "GuestCannotReviewOwnActiveNode");
      }
    }

    // ---------------------------------------------------------------------
    // OWNER LOGIC
    // ---------------------------------------------------------------------
    if (isOwner) {
      const adjInfo = await loadAdjacentEdgesInfo();

      const doOwnerUndoEndorseEdgeCascade = async () => {
        // 2.2 delete adjacent edges created by owner
        const { deleted: deletedOwnerEdges, ownerCreated } =
          await ownerDeleteOwnerCreatedAdjacentEdges(adjInfo);

        // 2.3 remaining adjacent edges
        const remainingEdgeIds = adjInfo
          .map((e) => e.edge_id)
          .filter((id) => !ownerCreated.includes(id));

        // 2.3.1 delete owner ENDORSE on remaining edges
        await deleteOwnerEndorseOnEdges(remainingEdgeIds);

        // supported guests for node (after undo endorse, owner no longer counts)
        const supportedIds = await getSupportedUserIdsForNode();

        // 2.3.2 delete edges created by unsupported guest
        await deleteEdgesWithUnsupportedGuestCreator(
          remainingEdgeIds,
          supportedIds,
        );

        // refresh remaining edges after possible deletes (cheap: re-read adjacency)
        const adjInfo2 = await loadAdjacentEdgesInfo();
        const remaining2 = adjInfo2.map((e) => e.edge_id);

        // 2.3.3 delete guest ENDORSE on edges by unsupported guests
        await deleteUnsupportedGuestEdgeEndorses(remaining2, supportedIds);

        // 2.3.4 delete edges left with only CREATE/DELETE (no decision-like)
        await deleteEdgesWithNoDecisionsLeft(remaining2);

        return { deletedOwnerEdges };
      };

      // c) verdict null => delegate to a.2 or b.3 based on current decision
      if (isUndo) {
        if (!actorDecision) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "NoNodeDecisionToUndo");
        }

        if (actorDecisionVerdict === "ENDORSE") {
          // c.1 => apply a.2 steps
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);
          await doOwnerUndoEndorseEdgeCascade();

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: null,
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "OPPOSE") {
          // c.2 => apply b.3 (delete oppose)
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: null,
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: null,
          node: { id: nodeId },
        });
      }

      // a) ENDORSE
      if (verdict === "ENDORSE") {
        // 1 insert if none
        if (!actorDecision) {
          const { rows } = await c.query(
            `
            INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
            VALUES ($1, $2, 'ENDORSE'::v1verdict)
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [nodeId, actorId],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        // 2 undo-endorse
        if (actorDecisionVerdict === "ENDORSE") {
          // 2.1 delete review
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          // 2.2 + 2.3 cascade on edges
          await doOwnerUndoEndorseEdgeCascade();

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: null,
            node: { id: nodeId },
          });
        }

        // 3 if OPPOSE => change to ENDORSE
        if (actorDecisionVerdict === "OPPOSE") {
          const { rows } = await c.query(
            `
            UPDATE v1nodereviews
            SET verdict = 'ENDORSE'::v1verdict
            WHERE id = $1
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [actorDecision.id],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: actorDecision,
          node: { id: nodeId },
        });
      }

      // b) OPPOSE
      if (verdict === "OPPOSE") {
        const supportedIds = await getSupportedUserIdsForNode();
        const adjInfoNow = await loadAdjacentEdgesInfo();

        const ownerOpposeEdgeCascade = async () => {
          // 1.1 / 2.1 delete edges created by owner
          const { ownerCreated } =
            await ownerDeleteOwnerCreatedAdjacentEdges(adjInfoNow);

          // remaining edges
          const remainingEdgeIds = adjInfoNow
            .map((e) => e.edge_id)
            .filter((id) => !ownerCreated.includes(id));

          // 2.2.1 delete edges created by unsupported guest (as per rule)
          await deleteEdgesWithUnsupportedGuestCreator(
            remainingEdgeIds,
            supportedIds,
          );

          // refresh
          const adjInfo2 = await loadAdjacentEdgesInfo();
          const remaining2 = adjInfo2.map((e) => e.edge_id);

          // 2.2.2 delete guest ENDORSE reviews by unsupported guests
          await deleteUnsupportedGuestEdgeEndorses(remaining2, supportedIds);

          // 2.2.3 delete edges left only with CREATE/DELETE
          await deleteEdgesWithNoDecisionsLeft(remaining2);

          // after deletions, apply owner edge oppose:
          const adjInfo3 = await loadAdjacentEdgesInfo();
          const edgeIds3 = adjInfo3.map((e) => e.edge_id);

          // 1.2 / 2.2.4 / 2.2.5:
          // for each remaining edge not owner-created:
          //   if no owner review => add OPPOSE
          //   if owner ENDORSE => change to OPPOSE
          await c.query(
            `
            WITH candidates AS (
              SELECT unnest($1::uuid[]) AS edge_id
            ),
            owner_endorse AS (
              SELECT r.id AS review_id, r.edge_id
              FROM v1edgereviews r
              JOIN candidates c ON c.edge_id = r.edge_id
              WHERE r.reviewer_id = $2 AND r.verdict = 'ENDORSE'::v1verdict
            ),
            owner_any AS (
              SELECT DISTINCT r.edge_id
              FROM v1edgereviews r
              JOIN candidates c ON c.edge_id = r.edge_id
              WHERE r.reviewer_id = $2
                AND r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
            )
            -- change ENDORSE -> OPPOSE
            UPDATE v1edgereviews r
            SET verdict = 'OPPOSE'::v1verdict
            FROM owner_endorse oe
            WHERE r.id = oe.review_id;
            `,
            [edgeIds3, ownerId],
          );

          // insert OPPOSE where no owner decision exists
          await c.query(
            `
            INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
            SELECT e.id, $2, 'OPPOSE'::v1verdict
            FROM v1edges e
            WHERE e.id = ANY($1::uuid[])
              AND NOT EXISTS (
                SELECT 1
                FROM v1edgereviews r
                WHERE r.edge_id = e.id
                  AND r.reviewer_id = $2
                  AND r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
              )
            `,
            [edgeIds3, ownerId],
          );
        };

        if (!actorDecision) {
          // 1) none -> check adjacency then add node OPPOSE and edge cascades
          await ownerOpposeEdgeCascade();

          const { rows } = await c.query(
            `
            INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
            VALUES ($1, $2, 'OPPOSE'::v1verdict)
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [nodeId, actorId],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "ENDORSE") {
          // 2) undo-endorse + oppose (change node verdict, cascade edges)
          await ownerOpposeEdgeCascade();

          const { rows } = await c.query(
            `
            UPDATE v1nodereviews
            SET verdict = 'OPPOSE'::v1verdict
            WHERE id = $1
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [actorDecision.id],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "OPPOSE") {
          // 3) undo-oppose
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "owner",
            review: null,
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: actorDecision,
          node: { id: nodeId },
        });
      }

      await c.query("ROLLBACK");
      return httpErr(res, 400, "InvalidOwnerVerdict");
    }

    // ---------------------------------------------------------------------
    // GUEST LOGIC
    // ---------------------------------------------------------------------
    {
      const adjInfo = await loadAdjacentEdgesInfo();

      // guest helper for undo-endorse on node: handle adjacent edges per spec
      const guestUndoEndorseEdgeCascade = async () => {
        // 2.1.1 handle edges CREATE by actor and not DELETE
        const r1 = await guestHandleOwnActiveCreatedEdgesOnUndoEndorse(adjInfo);

        // 2.1.2 edges with CREATE+DELETE+ENDORSE by actor => delete ENDORSE
        await c.query(
          `
          DELETE FROM v1edgereviews r
          WHERE r.edge_id = ANY(
            SELECT e.id
            FROM v1edges e
            WHERE e.project_id = $1
              AND (e.source_id = $2 OR e.target_id = $2)
          )
          AND r.reviewer_id = $3
          AND r.verdict = 'ENDORSE'::v1verdict
          `,
          [projectId, nodeId, actorId],
        );

        // 2.1.3 edges with ENDORSE but no CREATE/DELETE by actor => delete ENDORSE
        // (covered by delete above; it deletes any actor ENDORSE regardless of create/delete)

        return r1;
      };

      // c) verdict null => route based on current decision (must exist)
      if (isUndo) {
        if (!actorDecision) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "NoNodeDecisionToUndo");
        }

        if (actorDecisionVerdict === "ENDORSE") {
          // a.2 (edge cascade) then delete node endorse
          await guestUndoEndorseEdgeCascade();
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: null,
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "OPPOSE") {
          // b.2 delete node oppose
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: null,
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: null,
          node: { id: nodeId },
        });
      }

      // a) ENDORSE
      if (verdict === "ENDORSE") {
        if (!actorDecision) {
          // 1 add ENDORSE
          const { rows } = await c.query(
            `
            INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
            VALUES ($1, $2, 'ENDORSE'::v1verdict)
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [nodeId, actorId],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "ENDORSE") {
          // 2 undo-endorse: handle adjacent edges, then delete node endorse
          await guestUndoEndorseEdgeCascade();
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: null,
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "OPPOSE") {
          // 3 undo-oppose + endorse
          const { rows } = await c.query(
            `
            UPDATE v1nodereviews
            SET verdict = 'ENDORSE'::v1verdict
            WHERE id = $1
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [actorDecision.id],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: actorDecision,
          node: { id: nodeId },
        });
      }

      // b) OPPOSE
      if (verdict === "OPPOSE") {
        // 1: if no decision OR existing ENDORSE => do edge checks/cascade
        const needEdgeCascade =
          !actorDecision || actorDecisionVerdict === "ENDORSE";

        if (needEdgeCascade) {
          // 1.1 handle edges CREATE by actor and not DELETE:
          // if they have other reviews => add DELETE, else delete edges
          await guestHandleOwnActiveCreatedEdgesOnUndoEndorse(adjInfo);

          // 1.2 if edges have CREATE+DELETE+ENDORSE by actor => change ENDORSE -> OPPOSE
          await c.query(
            `
            UPDATE v1edgereviews
            SET verdict = 'OPPOSE'::v1verdict
            WHERE reviewer_id = $3
              AND verdict = 'ENDORSE'::v1verdict
              AND edge_id = ANY(
                SELECT e.id
                FROM v1edges e
                WHERE e.project_id = $1
                  AND (e.source_id = $2 OR e.target_id = $2)
              )
            `,
            [projectId, nodeId, actorId],
          );

          // 1.3 if there are adjacent edges without actor ENDORSE/OPPOSE => add OPPOSE (lightweight)
          await c.query(
            `
            INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
            SELECT e.id, $3, 'OPPOSE'::v1verdict
            FROM v1edges e
            WHERE e.project_id = $1
              AND (e.source_id = $2 OR e.target_id = $2)
              AND NOT EXISTS (
                SELECT 1
                FROM v1edgereviews r
                WHERE r.edge_id = e.id
                  AND r.reviewer_id = $3
                  AND r.verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict)
              )
            `,
            [projectId, nodeId, actorId],
          );
        }

        // 1.4 node review: if existing ENDORSE -> change to OPPOSE else add OPPOSE
        if (!actorDecision) {
          const { rows } = await c.query(
            `
            INSERT INTO v1nodereviews (node_id, reviewer_id, verdict)
            VALUES ($1, $2, 'OPPOSE'::v1verdict)
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [nodeId, actorId],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "ENDORSE") {
          const { rows } = await c.query(
            `
            UPDATE v1nodereviews
            SET verdict = 'OPPOSE'::v1verdict
            WHERE id = $1
            RETURNING id, node_id, reviewer_id, verdict
            `,
            [actorDecision.id],
          );

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: rows[0],
            node: { id: nodeId },
          });
        }

        if (actorDecisionVerdict === "OPPOSE") {
          // 2 delete node oppose (toggle off)
          await c.query(`DELETE FROM v1nodereviews WHERE id = $1`, [
            actorDecision.id,
          ]);

          await c.query("COMMIT");
          return res.status(200).json({
            success: true,
            role: "guest",
            review: null,
            node: { id: nodeId },
          });
        }

        console.log("no changes made");
        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: actorDecision,
          node: { id: nodeId },
        });
      }

      await c.query("ROLLBACK");
      return httpErr(res, 400, "InvalidGuestVerdict");
    }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("upsertNodeReview failed", e);
    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: String(e?.message || e),
    });
  } finally {
    c.release();
  }
}

// ==========================================================
// EDGES
// ==========================================================

// GET /api/project/:projectId/edges
export async function getProjectEdges(req, res) {
  const { projectId } = req.params;

  const projectReq = await getProjectAuth(projectId, req.user.id);
  if (!projectReq) return httpErr(res, 404, "Not found");
  if (projectReq.denied) return httpErr(res, 403, "Forbidden");

  try {
    const { rows } = await pool.query(
      `
      WITH e0 AS (
        SELECT e.id, e.source_id, e.target_id
        FROM v1edges e
        WHERE e.project_id = $1
      ),
      creator AS (
        SELECT
          r.edge_id,
          MIN(r.reviewer_id::text)::uuid AS creator_id
        FROM v1edgereviews r
        JOIN e0 ON e0.id = r.edge_id
        WHERE r.verdict = 'CREATE'::v1verdict
        GROUP BY r.edge_id
      ),
      abandoned AS (
        SELECT
          r.edge_id,
          TRUE AS abandoned
        FROM v1edgereviews r
        JOIN creator c ON c.edge_id = r.edge_id
        WHERE r.verdict = 'DELETE'::v1verdict
          AND r.reviewer_id = c.creator_id
        GROUP BY r.edge_id
      ),
      owner_review AS (
        SELECT
          r.edge_id,
          CASE
            WHEN bool_or(r.reviewer_id = $2 AND r.verdict = 'ENDORSE'::v1verdict) THEN 'APPROVED'
            WHEN bool_or(r.reviewer_id = $2 AND r.verdict = 'OPPOSE'::v1verdict)  THEN 'REJECTED'
            WHEN bool_or(r.reviewer_id = $2 AND r.verdict = 'POSTPONE'::v1verdict) THEN 'POSTPONED'
            ELSE NULL
          END AS owner_review
        FROM v1edgereviews r
        JOIN e0 ON e0.id = r.edge_id
        GROUP BY r.edge_id
      ),
      guest_agg AS (
        SELECT
          r.edge_id,
          ARRAY_REMOVE(
            ARRAY_AGG(DISTINCT r.reviewer_id) FILTER (
              WHERE r.verdict = 'ENDORSE'::v1verdict AND r.reviewer_id <> $2
            ),
            NULL
          ) AS liked_by,
          ARRAY_REMOVE(
            ARRAY_AGG(DISTINCT r.reviewer_id) FILTER (
              WHERE r.verdict = 'OPPOSE'::v1verdict AND r.reviewer_id <> $2
            ),
            NULL
          ) AS disliked_by
        FROM v1edgereviews r
        JOIN e0 ON e0.id = r.edge_id
        GROUP BY r.edge_id
      )
      SELECT
        e0.id,
        e0.source_id,
        e0.target_id,
        c.creator_id,
        COALESCE(ab.abandoned, FALSE) AS abandoned,
        o.owner_review,
        COALESCE(g.liked_by, ARRAY[]::uuid[])    AS liked_by,
        COALESCE(g.disliked_by, ARRAY[]::uuid[]) AS disliked_by
      FROM e0
      LEFT JOIN creator c      ON c.edge_id = e0.id
      LEFT JOIN abandoned ab   ON ab.edge_id = e0.id
      LEFT JOIN owner_review o ON o.edge_id = e0.id
      LEFT JOIN guest_agg g    ON g.edge_id = e0.id
      ORDER BY e0.id ASC
  `,
      [projectId, projectReq.owner_id],
    );

    const edges = rows.map((r) => {
      // const likedBy = Array.isArray(r.liked_by) ? r.liked_by : [];
      // const dislikedBy = Array.isArray(r.disliked_by) ? r.disliked_by : [];

      // const likesCount = likedBy.length;
      // const dislikesCount = dislikedBy.length;
      // const total = likesCount + dislikesCount;
      // const approvalRate = total > 0 ? likesCount / total : 0;

      return {
        id: r.id,
        source_id: r.source_id,
        target_id: r.target_id,

        creator_id: r.creator_id ?? null,
        abandoned: Boolean(r.abandoned),
        owner_review: r.owner_review ?? null, // APPROVED | REJECTED | POSTPONED | null

        liked_by: r.liked_by,
        disliked_by: r.disliked_by,
        // approvalRate,
        // likesCount,
        // dislikesCount,
      };
    });

    return res.json({ success: true, edges });
  } catch (e) {
    // ca să vezi exact cauza 500-ului în log
    console.error("getProjectEdges failed:", e);
    return httpErr(res, 500, e?.message || "Server error");
  }
}

// POST /api/project/:projectId/edges
// Body: { source_id: uuid, target_id: uuid }
export async function createProjectEdge(req, res) {
  const { projectId } = req.params;
  const { source_id, target_id } = req.body || {};
  const actorId = req.user.id;

  const pr = await getProjectAuth(projectId, actorId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  if (!source_id || !target_id) return httpErr(res, 400, "Missing source_id/target_id");
  if (source_id === target_id) return httpErr(res, 400, "InvalidEdgeSelfLoop");

  const ownerId = pr.owner_id;
  const isOwner = actorId === ownerId;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // 1) nodes must exist in project
    const { rows: nodes } = await c.query(
      `SELECT id FROM v1nodes WHERE project_id = $1 AND id IN ($2, $3)`,
      [projectId, source_id, target_id],
    );
    if (nodes.length !== 2) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "NodeNotFound");
    }

    // helpers ------------------------------------------------------------

    const hasNodeCreate = async (nodeId, userId) => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict = 'CREATE'::v1verdict
        ) AS ok
        `,
        [nodeId, userId],
      );
      return Boolean(rows[0]?.ok);
    };

    const hasNodeDelete = async (nodeId, userId) => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict = 'DELETE'::v1verdict
        ) AS ok
        `,
        [nodeId, userId],
      );
      return Boolean(rows[0]?.ok);
    };

    const hasNodeEndorse = async (nodeId, userId) => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews
          WHERE node_id = $1
            AND reviewer_id = $2
            AND verdict = 'ENDORSE'::v1verdict
        ) AS ok
        `,
        [nodeId, userId],
      );
      return Boolean(rows[0]?.ok);
    };

    // “supported” definitions:
    // owner supported := owner CREATE OR owner ENDORSE
    // actor supported (guest) := actor ENDORSE OR (actor CREATE AND NOT actor DELETE)
    const ownerSupportsNode = async (nodeId) => {
      const created = await hasNodeCreate(nodeId, ownerId);
      if (created) return true;
      return await hasNodeEndorse(nodeId, ownerId);
    };

    const actorGuestSupportsNode = async (nodeId) => {
      if (await hasNodeEndorse(nodeId, actorId)) return true;
      const created = await hasNodeCreate(nodeId, actorId);
      if (!created) return false;
      const deleted = await hasNodeDelete(nodeId, actorId);
      return !deleted;
    };

    // 2) permission checks
    if (isOwner) {
      const sOk = await ownerSupportsNode(source_id);
      const tOk = await ownerSupportsNode(target_id);

      if (!sOk || !tOk) {
        await c.query("ROLLBACK");
        return httpErr(res, 403, "OwnerMustSupportBothNodes");
      }
    } else {
      // guest: each node must be supported by owner OR by actor (as guest rules)
      const sOk = (await ownerSupportsNode(source_id)) || (await actorGuestSupportsNode(source_id));
      const tOk = (await ownerSupportsNode(target_id)) || (await actorGuestSupportsNode(target_id));

      if (!sOk || !tOk) {
        await c.query("ROLLBACK");
        return httpErr(res, 403, "GuestMustSupportBothNodes");
      }
    }

    // 3) create edge
    const { rows: [edge] } = await c.query(
      `
      INSERT INTO v1edges (project_id, source_id, target_id)
      VALUES ($1, $2, $3)
      RETURNING id, project_id, source_id, target_id
      `,
      [projectId, source_id, target_id],
    );

    // 4) create edge review CREATE (no trigger) — same pattern as nodes
    await c.query(
      `
      INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
      VALUES ($1, $2, 'CREATE'::v1verdict)
      `,
      [edge.id, actorId],
    );

    await c.query("COMMIT");
    return res.status(201).json({
      success: true,
      edge,
    });
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});

    if (err.code === "23505") {
      // if you have UNIQUE(project_id, source_id, target_id) on v1edges
      return res.status(409).json({
        success: false,
        code: "EDGE_CONFLICT",
        message: "Edge already exists.",
      });
    }

    console.error("createProjectEdge failed", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: String(err?.message || err),
    });
  } finally {
    c.release();
  }
}
// DELETE /api/project/:projectId/edges/:edgeId
export async function deleteProjectEdge(req, res) {
  const { projectId, edgeId } = req.params;
  const actorId = req.user.id;

  const pr = await getProjectAuth(projectId, actorId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const ownerId = pr.owner_id;
  const isOwner = actorId === ownerId;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // 0) edge must exist in project
    const { rows: edgeRows } = await c.query(
      `SELECT id FROM v1edges WHERE id = $1 AND project_id = $2`,
      [edgeId, projectId],
    );
    if (!edgeRows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Edge not found");
    }

    // OWNER: hard delete edge (reviews via FK cascade ideally)
    if (isOwner) {
      // if you do NOT have ON DELETE CASCADE on v1edgereviews.edge_id, delete reviews first
      await c.query(`DELETE FROM v1edgereviews WHERE edge_id = $1`, [edgeId]);
      await c.query(`DELETE FROM v1edges WHERE id = $1`, [edgeId]);

      await c.query("COMMIT");
      return res.status(200).json({ success: true, deleted: true, mode: "owner_hard_delete" });
    }

    // GUEST RULES ---------------------------------------------------------

    // 1) must have CREATE by actor
    const { rows: hasCreateRows } = await c.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM v1edgereviews
        WHERE edge_id = $1
          AND reviewer_id = $2
          AND verdict = 'CREATE'::v1verdict
      ) AS ok
      `,
      [edgeId, actorId],
    );
    const hasCreate = Boolean(hasCreateRows[0]?.ok);
    if (!hasCreate) {
      await c.query("ROLLBACK");
      return httpErr(res, 403, "GuestCannotDeleteEdgeNotCreatedByActor");
    }

    // 2) must NOT have any owner review (decision-like; tighten if you mean any review at all)
    const { rows: ownerReviewRows } = await c.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM v1edgereviews
        WHERE edge_id = $1
          AND reviewer_id = $2
          AND verdict IN ('ENDORSE'::v1verdict,'OPPOSE'::v1verdict,'POSTPONE'::v1verdict)
      ) AS ok
      `,
      [edgeId, ownerId],
    );
    const hasOwnerDecision = Boolean(ownerReviewRows[0]?.ok);
    if (hasOwnerDecision) {
      await c.query("ROLLBACK");
      return httpErr(res, 409, "OwnerEdgeDecisionAlreadySet");
    }

    // 3) if already has CREATE and DELETE by actor => error
    const { rows: hasDeleteRows } = await c.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM v1edgereviews
        WHERE edge_id = $1
          AND reviewer_id = $2
          AND verdict = 'DELETE'::v1verdict
      ) AS ok
      `,
      [edgeId, actorId],
    );
    const hasDelete = Boolean(hasDeleteRows[0]?.ok);
    if (hasDelete) {
      await c.query("ROLLBACK");
      return httpErr(res, 409, "EdgeAlreadyDeletedByActor");
    }

    // 4) has CREATE and no DELETE:
    // 4.1 if edge has other reviews => add DELETE review by actor
    // 4.2 else hard delete edge + reviews
    const { rows: otherReviewsRows } = await c.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM v1edgereviews r
        WHERE r.edge_id = $1
          AND NOT (r.reviewer_id = $2 AND r.verdict = 'CREATE'::v1verdict)
      ) AS has_other_reviews
      `,
      [edgeId, actorId],
    );
    const hasOtherReviews = Boolean(otherReviewsRows[0]?.has_other_reviews);

    if (hasOtherReviews) {
      const { rows: delRows } = await c.query(
        `
        INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
        VALUES ($1, $2, 'DELETE'::v1verdict)
        RETURNING id, edge_id, reviewer_id, verdict
        `,
        [edgeId, actorId],
      );

      await c.query("COMMIT");
      return res.status(200).json({
        success: true,
        deleted: false,
        mode: "guest_soft_delete",
        review: delRows[0],
      });
    }

    // 4.2: only CREATE exists (no other reviews) => hard delete edge + reviews
    await c.query(`DELETE FROM v1edgereviews WHERE edge_id = $1`, [edgeId]);
    await c.query(`DELETE FROM v1edges WHERE id = $1`, [edgeId]);

    await c.query("COMMIT");
    return res.status(200).json({ success: true, deleted: true, mode: "guest_hard_delete" });
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("deleteProjectEdge failed", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: String(err?.message || err),
    });
  } finally {
    c.release();
  }
}

// PATCH /api/project/:projectId/edges/:edgeId/owner-decision
// Body: { decision: 'ACCEPTED' | 'REJECTED' }
export async function setEdgeOwnerDecision(req, res) {
  const { projectId, edgeId } = req.params;
  const { decision } = req.body || {};

  if (decision !== "ACCEPTED" && decision !== "REJECTED") {
    return httpErr(res, 400, "Invalid decision");
  }

  const pr = await getProjectAuth(projectId, req.user.id);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  if (pr.owner_id !== req.user.id) return httpErr(res, 403, "OwnerOnly");

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    const edge = await c.query(
      `
      SELECT id, owner_decision, deleted_at
      FROM edges
      WHERE id=$1 AND project_id=$2
      FOR UPDATE
      `,
      [edgeId, projectId],
    );

    if (!edge.rows[0]) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Edge not found");
    }

    if (edge.rows[0].deleted_at) {
      await c.query("ROLLBACK");
      return httpErr(res, 409, "EdgeDeleted");
    }

    if (edge.rows[0].owner_decision !== "PENDING") {
      await c.query("ROLLBACK");
      return httpErr(res, 409, `Already${edge.rows[0].owner_decision}`);
    }

    const upd = await c.query(
      `
      UPDATE edges
      SET owner_decision = $3
      WHERE id=$1 AND project_id=$2
      RETURNING id, project_id, source_id, target_id, creator_id, owner_decision, deleted_at, deleted_by
      `,
      [edgeId, projectId, decision],
    );

    await c.query("COMMIT");
    return res.status(200).json({ success: true, edge: upd.rows[0] });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    return httpErr(res, 500, "Server error");
  } finally {
    c.release();
  }
}

// PUT /api/project/:projectId/edges/:edgeId/review
// Body: { verdict: 'POSITIVE' | 'NEGATIVE' | null }
export async function upsertEdgeReview(req, res) {
  const { projectId, edgeId } = req.params;
  const { verdict } = req.body || {}; // 'ENDORSE' | 'OPPOSE' | null
  const actorId = req.user.id;

  const pr = await getProjectAuth(projectId, actorId);
  if (!pr) return httpErr(res, 404, "Not found");
  if (pr.denied) return httpErr(res, 403, "Forbidden");

  const ownerId = pr.owner_id;
  const isOwner = actorId === ownerId;
  const isUndo = verdict == null;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // 0) edge must exist and belong to project + fetch source/target
    const { rows: edgeRows } = await c.query(
      `SELECT id, source_id, target_id
       FROM v1edges
       WHERE id = $1 AND project_id = $2`,
      [edgeId, projectId],
    );
    const edge = edgeRows[0];
    if (!edge) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "Edge not found");
    }

    const sourceId = edge.source_id;
    const targetId = edge.target_id;

    // 1) source/target nodes must exist
    const { rows: nodesOk } = await c.query(
      `SELECT id FROM v1nodes WHERE project_id = $1 AND id IN ($2, $3)`,
      [projectId, sourceId, targetId],
    );
    if (nodesOk.length !== 2) {
      await c.query("ROLLBACK");
      return httpErr(res, 404, "EdgeNodeMissing");
    }

    // helpers ------------------------------------------------------

    const getNodeCreator = async (nodeId) => {
      const { rows } = await c.query(
        `
        SELECT r.reviewer_id AS creator_id
        FROM v1nodereviews r
        WHERE r.node_id = $1 AND r.verdict = 'CREATE'::v1verdict
        ORDER BY r.id ASC
        LIMIT 1
        `,
        [nodeId],
      );
      return rows[0]?.creator_id ?? null;
    };

    const isNodeAbandonedByCreator = async (nodeId, creatorId) => {
      if (!creatorId) return false;
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews d
          WHERE d.node_id = $1
            AND d.reviewer_id = $2
            AND d.verdict = 'DELETE'::v1verdict
        ) AS abandoned
        `,
        [nodeId, creatorId],
      );
      return Boolean(rows[0]?.abandoned);
    };

    const hasNodeEndorse = async (nodeId, userId) => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews r
          WHERE r.node_id = $1
            AND r.reviewer_id = $2
            AND r.verdict = 'ENDORSE'::v1verdict
        ) AS ok
        `,
        [nodeId, userId],
      );
      return Boolean(rows[0]?.ok);
    };

    const hasNodeOppose = async (nodeId, userId) => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1nodereviews r
          WHERE r.node_id = $1
            AND r.reviewer_id = $2
            AND r.verdict = 'OPPOSE'::v1verdict
        ) AS ok
        `,
        [nodeId, userId],
      );
      return Boolean(rows[0]?.ok);
    };

    const getEdgeCreator = async () => {
      const { rows } = await c.query(
        `
        SELECT r.reviewer_id AS creator_id
        FROM v1edgereviews r
        WHERE r.edge_id = $1 AND r.verdict = 'CREATE'::v1verdict
        ORDER BY r.id ASC
        LIMIT 1
        `,
        [edgeId],
      );
      return rows[0]?.creator_id ?? null;
    };

    const actorHasEdgeCreate = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1edgereviews r
          WHERE r.edge_id = $1
            AND r.reviewer_id = $2
            AND r.verdict = 'CREATE'::v1verdict
        ) AS ok
        `,
        [edgeId, actorId],
      );
      return Boolean(rows[0]?.ok);
    };

    const actorHasEdgeDelete = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1edgereviews r
          WHERE r.edge_id = $1
            AND r.reviewer_id = $2
            AND r.verdict = 'DELETE'::v1verdict
        ) AS ok
        `,
        [edgeId, actorId],
      );
      return Boolean(rows[0]?.ok);
    };

    const ownerHasAnyEdgeDecision = async () => {
      const { rows } = await c.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM v1edgereviews r
          WHERE r.edge_id = $1
            AND r.reviewer_id = $2
            AND r.verdict IN ('ENDORSE'::v1verdict, 'OPPOSE'::v1verdict, 'POSTPONE'::v1verdict)
        ) AS ok
        `,
        [edgeId, ownerId],
      );
      return Boolean(rows[0]?.ok);
    };

    const getActorEdgeDecision = async () => {
      const { rows } = await c.query(
        `
        SELECT id, verdict
        FROM v1edgereviews
        WHERE edge_id = $1
          AND reviewer_id = $2
          AND verdict IN ('ENDORSE'::v1verdict, 'OPPOSE'::v1verdict)
        ORDER BY id DESC
        LIMIT 1
        `,
        [edgeId, actorId],
      );
      return rows[0] ?? null; // {id, verdict} or null
    };

    const insertEdgeDecision = async (v) => {
      const { rows } = await c.query(
        `
        INSERT INTO v1edgereviews (edge_id, reviewer_id, verdict)
        VALUES ($1, $2, $3::v1verdict)
        RETURNING id, edge_id, reviewer_id, verdict
        `,
        [edgeId, actorId, v],
      );
      return rows[0];
    };

    const updateEdgeDecision = async (id, v) => {
      const { rows } = await c.query(
        `
        UPDATE v1edgereviews
        SET verdict = $2::v1verdict
        WHERE id = $1
        RETURNING id, edge_id, reviewer_id, verdict
        `,
        [id, v],
      );
      return rows[0];
    };

    const deleteEdgeDecisionById = async (id) => {
      const { rows } = await c.query(
        `
        DELETE FROM v1edgereviews
        WHERE id = $1
        RETURNING id, edge_id, reviewer_id, verdict
        `,
        [id],
      );
      return rows[0] ?? null;
    };

    const nodeCreatorSource = await getNodeCreator(sourceId);
    const nodeCreatorTarget = await getNodeCreator(targetId);

    // ----------------------------------------------------------------
    // ROLE-SPECIFIC PRECHECKS
    // ----------------------------------------------------------------
    if (isOwner) {
      // owner: edge must not have CREATE by actor
      if (await actorHasEdgeCreate()) {
        await c.query("ROLLBACK");
        return httpErr(res, 409, "OwnerCannotReviewOwnCreatedEdge");
      }
    } else {
      // guest:
      // - edge must not have owner review
      // - and (no CREATE by actor) OR (has CREATE and has DELETE)  (i.e., abandoned by actor)
      const hasOwnerEdgeReview = await ownerHasAnyEdgeDecision();
      if (hasOwnerEdgeReview) {
        await c.query("ROLLBACK");
        return httpErr(res, 409, "OwnerEdgeDecisionAlreadySet");
      }

      const hasCreate = await actorHasEdgeCreate();
      const hasDelete = await actorHasEdgeDelete();
      if (hasCreate && !hasDelete) {
        await c.query("ROLLBACK");
        return httpErr(res, 403, "GuestCannotReviewOwnActiveEdge");
      }
    }

    // ----------------------------------------------------------------
    // ACTIONS
    // ----------------------------------------------------------------
    const actorDecision = await getActorEdgeDecision(); // may be null

    // ---------- OWNER ----------
    if (isOwner) {
      // a) ENDORSE
      if (verdict === "ENDORSE") {
        // nodes must be endorsed by owner OR created by owner
        const sourceOk =
          nodeCreatorSource === ownerId ||
          (await hasNodeEndorse(sourceId, ownerId));
        const targetOk =
          nodeCreatorTarget === ownerId ||
          (await hasNodeEndorse(targetId, ownerId));

        if (!sourceOk || !targetOk) {
          await c.query("ROLLBACK");
          return httpErr(res, 403, "OwnerMustEndorseOrCreateBothNodes");
        }

        let result = null;
        if (!actorDecision) {
          result = await insertEdgeDecision("ENDORSE");
        } else if (actorDecision.verdict === "ENDORSE") {
          result = await deleteEdgeDecisionById(actorDecision.id);
          result = null;
        } else if (actorDecision.verdict === "OPPOSE") {
          result = await updateEdgeDecision(actorDecision.id, "ENDORSE");
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: result,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      // b) OPPOSE
      if (verdict === "OPPOSE") {
        // must NOT exist at least one of nodes with OPPOSE by owner
        const sourceOpp = await hasNodeOppose(sourceId, ownerId);
        const targetOpp = await hasNodeOppose(targetId, ownerId);
        if (sourceOpp || targetOpp) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "OwnerCannotOpposeEdgeWithOpposedNode");
        }

        let result = null;
        if (!actorDecision) {
          result = await insertEdgeDecision("OPPOSE");
        } else if (actorDecision.verdict === "ENDORSE") {
          result = await updateEdgeDecision(actorDecision.id, "OPPOSE");
        } else if (actorDecision.verdict === "OPPOSE") {
          // 3.1 if exists at least one node opposed by owner -> error
          // (redundant with above, but keep per spec)
          if (sourceOpp || targetOpp) {
            await c.query("ROLLBACK");
            return httpErr(res, 409, "OwnerCannotUndoOpposeDueToOpposedNode");
          }
          // 3.2 else delete
          await deleteEdgeDecisionById(actorDecision.id);
          result = null;
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: result,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      // c) UNDO (null)
      if (isUndo) {
        if (!actorDecision) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "NoEdgeDecisionToUndo");
        }

        if (actorDecision.verdict === "ENDORSE") {
          await deleteEdgeDecisionById(actorDecision.id);
        } else if (actorDecision.verdict === "OPPOSE") {
          // delete only if NOT exists at least one node opposed by owner
          const sourceOpp = await hasNodeOppose(sourceId, ownerId);
          const targetOpp = await hasNodeOppose(targetId, ownerId);
          if (sourceOpp || targetOpp) {
            await c.query("ROLLBACK");
            return httpErr(res, 409, "OwnerCannotUndoOpposeDueToOpposedNode");
          }
          await deleteEdgeDecisionById(actorDecision.id);
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "owner",
          review: null,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      await c.query("ROLLBACK");
      return httpErr(res, 400, "InvalidVerdict");
    }

    // ---------- GUEST ----------
    {
      // a) ENDORSE
      if (verdict === "ENDORSE") {
        // nodes must be:
        // - endorsed by actor OR created by actor (and not abandoned)
        // - OR created by owner OR endorsed by owner
        const actorSourceCreator = nodeCreatorSource === actorId;
        const actorTargetCreator = nodeCreatorTarget === actorId;

        const actorSourceAbandoned = actorSourceCreator
          ? await isNodeAbandonedByCreator(sourceId, actorId)
          : false;
        const actorTargetAbandoned = actorTargetCreator
          ? await isNodeAbandonedByCreator(targetId, actorId)
          : false;

        const sourceOk =
          (await hasNodeEndorse(sourceId, actorId)) ||
          (actorSourceCreator && !actorSourceAbandoned) ||
          nodeCreatorSource === ownerId ||
          (await hasNodeEndorse(sourceId, ownerId));

        const targetOk =
          (await hasNodeEndorse(targetId, actorId)) ||
          (actorTargetCreator && !actorTargetAbandoned) ||
          nodeCreatorTarget === ownerId ||
          (await hasNodeEndorse(targetId, ownerId));

        if (!sourceOk || !targetOk) {
          await c.query("ROLLBACK");
          return httpErr(res, 403, "GuestMustSupportBothNodes");
        }

        let result = null;
        if (!actorDecision) {
          result = await insertEdgeDecision("ENDORSE");
        } else if (actorDecision.verdict === "ENDORSE") {
          await deleteEdgeDecisionById(actorDecision.id);
          result = null;
        } else if (actorDecision.verdict === "OPPOSE") {
          result = await updateEdgeDecision(actorDecision.id, "ENDORSE");
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: result,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      // b) OPPOSE
      if (verdict === "OPPOSE") {
        // must not exist at least one node opposed by owner OR actor
        const sourceOppOwner = await hasNodeOppose(sourceId, ownerId);
        const targetOppOwner = await hasNodeOppose(targetId, ownerId);
        const sourceOppActor = await hasNodeOppose(sourceId, actorId);
        const targetOppActor = await hasNodeOppose(targetId, actorId);

        if (
          sourceOppOwner ||
          targetOppOwner ||
          sourceOppActor ||
          targetOppActor
        ) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "GuestCannotOpposeEdgeWithOpposedNode");
        }

        let result = null;
        if (!actorDecision) {
          result = await insertEdgeDecision("OPPOSE");
        } else if (actorDecision.verdict === "ENDORSE") {
          result = await updateEdgeDecision(actorDecision.id, "OPPOSE");
        } else if (actorDecision.verdict === "OPPOSE") {
          await deleteEdgeDecisionById(actorDecision.id);
          result = null;
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: result,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      // c) UNDO (null)
      if (isUndo) {
        if (!actorDecision) {
          await c.query("ROLLBACK");
          return httpErr(res, 409, "NoEdgeDecisionToUndo");
        }

        if (actorDecision.verdict === "ENDORSE") {
          await deleteEdgeDecisionById(actorDecision.id);
        } else if (actorDecision.verdict === "OPPOSE") {
          const sourceOppOwner = await hasNodeOppose(sourceId, ownerId);
          const targetOppOwner = await hasNodeOppose(targetId, ownerId);
          const sourceOppActor = await hasNodeOppose(sourceId, actorId);
          const targetOppActor = await hasNodeOppose(targetId, actorId);

          if (
            sourceOppOwner ||
            targetOppOwner ||
            sourceOppActor ||
            targetOppActor
          ) {
            await c.query("ROLLBACK");
            return httpErr(res, 409, "GuestCannotUndoOpposeDueToOpposedNode");
          }
          await deleteEdgeDecisionById(actorDecision.id);
        } else {
          console.log("no changes made");
        }

        await c.query("COMMIT");
        return res.status(200).json({
          success: true,
          role: "guest",
          review: null,
          edge: { id: edgeId, sourceId, targetId },
        });
      }

      await c.query("ROLLBACK");
      return httpErr(res, 400, "InvalidVerdict");
    }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("upsertEdgeReview failed", e);
    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: String(e?.message || e),
    });
  } finally {
    c.release();
  }
}
