import pool from "../db/pool.js";

export async function adminSchoolIds(userId) {
  const { rows } = await pool.query(
    "SELECT school_id FROM memberships WHERE user_id=$1 AND user_role=$2",
    [userId, "admin"],
  );
  return rows.map((r) => r.school_id);
}

export async function userSchoolIds(userId) {
  const { rows } = await pool.query(
    "SELECT school_id FROM memberships WHERE user_id=$1",
    [userId],
  );
  return rows.map((r) => r.school_id);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

async function resolveAdminSchoolId(userId, requestedSchoolId) {
  const ids = await adminSchoolIds(userId);

  if (!ids.length) {
    return { error: { status: 403, message: "No admin school found" } };
  }

  const schoolId = requestedSchoolId || ids[0];

  if (!ids.includes(schoolId)) {
    return { error: { status: 403, message: "Forbidden" } };
  }

  return { schoolId, adminSchoolIds: ids };
}

export async function adminOverview(req, res) {
  const ids = await adminSchoolIds(req.user.id);
  if (!ids.length)
    return res.json({
      success: true,
      schools: [],
      teachers: [],
      students: [],
      requests_teachers: [],
      requests_students: [],
    });

  const schools = await pool.query(
    "SELECT * FROM schools WHERE id = ANY($1::uuid[])",
    [ids],
  );

  const teachers = await pool.query(
    `
    SELECT m.id as membership_id, m.school_id, m.user_id, m.user_role,
           u.email, u.name
    FROM memberships m
    JOIN users u ON u.id=m.user_id
    WHERE m.school_id = ANY($1::uuid[]) AND m.user_role='teacher'
    ORDER BY u.email
  `,
    [ids],
  );

  const students = await pool.query(
    `
    SELECT m.id as membership_id, m.school_id, m.user_id, m.user_role,
           u.email, u.name
    FROM memberships m
    JOIN users u ON u.id=m.user_id
    WHERE m.school_id = ANY($1::uuid[]) AND m.user_role='student'
    ORDER BY u.email
  `,
    [ids],
  );

  const requests = await pool.query(
    `
    SELECT r.id as request_id, r.school_id, r.user_id, r.user_role, r.accepted,
           u.email, u.name
    FROM member_req r
    JOIN users u ON u.id=r.user_id
    WHERE r.school_id = ANY($1::uuid[])
    ORDER BY r.accepted ASC, r.created_at ASC
  `,
    [ids],
  );

  return res.json({
    success: true,
    schools: schools.rows,
    teachers: teachers.rows,
    students: students.rows,
    requests_teachers: requests.rows.filter(
      (r) => !r.accepted && r.user_role === "teacher",
    ),
    requests_students: requests.rows.filter(
      (r) => !r.accepted && r.user_role === "student",
    ),
  });
}

export async function acceptRequest(req, res) {
  const { id } = req.params;
  const rq = await pool.query("SELECT * FROM member_req WHERE id=$1", [id]);
  const r = rq.rows[0];
  if (!r)
    return res
      .status(404)
      .json({ success: false, message: "Request not found" });

  const adminSchools = await adminSchoolIds(req.user.id);
  if (!adminSchools.includes(r.school_id))
    return res.status(403).json({ success: false, message: "Forbidden" });

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("UPDATE member_req SET accepted=true WHERE id=$1", [id]);
    await c.query(
      `
      INSERT INTO memberships (school_id,user_id,user_role)
      VALUES ($1,$2,$3)
      ON CONFLICT (school_id,user_id) DO UPDATE SET user_role=$3
    `,
      [r.school_id, r.user_id, r.user_role],
    );
    await c.query("COMMIT");
    return res.json({ success: true });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    c.release();
  }
}

export async function revokeMember(req, res) {
  const { membershipId } = req.params;
  const mq = await pool.query("SELECT * FROM memberships WHERE id=$1", [
    membershipId,
  ]);
  const m = mq.rows[0];
  if (!m)
    return res
      .status(404)
      .json({ success: false, message: "Membership not found" });

  const adminSchools = await adminSchoolIds(req.user.id);
  if (!adminSchools.includes(m.school_id))
    return res.status(403).json({ success: false, message: "Forbidden" });

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM memberships WHERE id=$1", [membershipId]);
    await c.query(
      "UPDATE member_req SET accepted=false WHERE school_id=$1 AND user_id=$2 AND user_role=$3",
      [m.school_id, m.user_id, m.user_role],
    );
    await c.query("COMMIT");
    return res.json({ success: true });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    c.release();
  }
}
export async function listMemberInvites(req, res) {
  const ids = await adminSchoolIds(req.user.id);

  if (!ids.length) {
    return res.json({
      success: true,
      invites: [],
    });
  }

  const { rows } = await pool.query(
    `
    SELECT
      i.id,
      i.school_id,
      s.name AS school_name,
      i.email,
      i.user_role,
      i.status,
      i.created_at,
      i.used_at,
      i.revoked_at,
      i.expires_at,
      invited_by.email AS invited_by_email,
      used_by.email AS used_by_email
    FROM member_invites i
    JOIN schools s ON s.id = i.school_id
    LEFT JOIN users invited_by ON invited_by.id = i.invited_by
    LEFT JOIN users used_by ON used_by.id = i.used_by
    WHERE i.school_id = ANY($1::uuid[])
    ORDER BY i.created_at DESC
    `,
    [ids],
  );

  return res.json({
    success: true,
    invites: rows,
  });
}

export async function createMemberInvite(req, res) {
  const { email, role, user_role, school_id } = req.body || {};
  const normalizedEmail = normalizeEmail(email);
  const inviteRole = role || user_role;

  if (!normalizedEmail || !["teacher", "student"].includes(inviteRole)) {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid fields",
    });
  }

  const resolved = await resolveAdminSchoolId(req.user.id, school_id);

  if (resolved.error) {
    return res.status(resolved.error.status).json({
      success: false,
      message: resolved.error.message,
    });
  }

  const existingUser = await pool.query(
    `
    SELECT id
    FROM users
    WHERE lower(email) = lower($1)
    `,
    [normalizedEmail],
  );

  if (existingUser.rows[0]) {
    return res.status(400).json({
      success: false,
      message: "A user already exists for this email",
    });
  }

  const c = await pool.connect();

  try {
    await c.query("BEGIN");

    const existingInvite = await c.query(
      `
      SELECT *
      FROM member_invites
      WHERE school_id = $1
        AND lower(email) = lower($2)
      FOR UPDATE
      `,
      [resolved.schoolId, normalizedEmail],
    );

    const current = existingInvite.rows[0];

    if (current?.status === "PENDING") {
      await c.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "A pending invitation already exists for this email",
      });
    }

    if (current?.status === "USED") {
      await c.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "This invitation was already used",
      });
    }

    let invite;

    if (current) {
      const updated = await c.query(
        `
        UPDATE member_invites
        SET
          user_role = $1,
          status = 'PENDING',
          invited_by = $2,
          used_by = NULL,
          used_at = NULL,
          revoked_at = NULL,
          expires_at = NULL
        WHERE id = $3
        RETURNING *
        `,
        [inviteRole, req.user.id, current.id],
      );

      invite = updated.rows[0];
    } else {
      const inserted = await c.query(
        `
        INSERT INTO member_invites (
          school_id,
          email,
          user_role,
          invited_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [resolved.schoolId, normalizedEmail, inviteRole, req.user.id],
      );

      invite = inserted.rows[0];
    }

    await c.query("COMMIT");

    return res.status(201).json({
      success: true,
      invite,
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[createMemberInvite] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    c.release();
  }
}

export async function revokeMemberInvite(req, res) {
  const { id } = req.params;

  const inviteQ = await pool.query(
    `
    SELECT *
    FROM member_invites
    WHERE id = $1
    `,
    [id],
  );

  const invite = inviteQ.rows[0];

  if (!invite) {
    return res.status(404).json({
      success: false,
      message: "Invitation not found",
    });
  }

  const adminSchools = await adminSchoolIds(req.user.id);

  if (!adminSchools.includes(invite.school_id)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  if (invite.status === "USED") {
    return res.status(409).json({
      success: false,
      message: "Used invitations cannot be revoked",
    });
  }

  const { rows } = await pool.query(
    `
    UPDATE member_invites
    SET
      status = 'REVOKED',
      revoked_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return res.json({
    success: true,
    invite: rows[0],
  });
}