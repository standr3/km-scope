import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import {
  issueAccess,
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/tokens.js";

const toUserDto = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  isVerified: row.is_verified,
  createdAt: row.created_at,
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function fetchUserWithRolesAndPending(userId) {
  const base = await pool.query(
    `
    SELECT u.*,
           COALESCE(array_agg(m.user_role) FILTER (WHERE m.user_role IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN memberships m ON m.user_id=u.id
    WHERE u.id=$1
    GROUP BY u.id
  `,
    [userId],
  );
  const u = base.rows[0];
  if (!u) return null;

  const schoolQ = await pool.query(
    `
    SELECT s.id, s.name, s.addr, s.contact_email, s.contact_phone
    FROM memberships m
    JOIN schools s ON s.id = m.school_id
    WHERE m.user_id = $1
    ORDER BY
      CASE
        WHEN m.user_role = 'admin' THEN 1
        WHEN m.user_role = 'teacher' THEN 2
        WHEN m.user_role = 'student' THEN 3
        ELSE 4
      END,
      s.name ASC
    LIMIT 1
  `,
    [userId],
  );

  const pending = await pool.query(
    `
    SELECT r.school_id, s.name AS school_name, r.user_role, r.accepted
    FROM member_req r
    JOIN schools s ON s.id=r.school_id
    WHERE r.user_id=$1
    ORDER BY r.accepted ASC, r.created_at ASC
  `,
    [userId],
  );

  return {
    user: toUserDto(u),
    roles: u.roles,
    school: schoolQ.rows[0] || null,
    pendingRequests: pending.rows,
  };
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Missing credentials" });
  const q = await pool.query(
    "SELECT * FROM users WHERE lower(email)=lower($1)",
    [email],
  );
  const u = q.rows[0];
  if (!u)
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });
  const ok = await bcryptjs.compare(password, u.password_hash);
  if (!ok)
    return res
      .status(400)
      .json({ success: false, message: "Invalid credentials" });

  const full = await fetchUserWithRolesAndPending(u.id);
  const access = issueAccess(full.user, full.roles);
  setRefreshCookie(res, full.user.id);
  return res.json({
    success: true,
    user: full.user,
    access_token: access,
    roles: full.roles,
    school: full.school,
    // pendingRequests: full.pendingRequests,
  });
}

export async function signup(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });
  const ex = await pool.query(
    "SELECT 1 FROM users WHERE lower(email)=lower($1)",
    [email],
  );
  if (ex.rows[0])
    return res.status(400).json({ success: false, message: "User exists" });
  const hash = await bcryptjs.hash(password, 10);
  const { rows } = await pool.query(
    "INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,true) RETURNING *",
    [name ?? null, email, hash],
  );
  const full = await fetchUserWithRolesAndPending(rows[0].id);
  const access = issueAccess(full.user, full.roles);
  setRefreshCookie(res, full.user.id);
  return res.status(201).json({
    success: true,
    user: full.user,
    access_token: access,
    roles: full.roles,
  });
}

export async function registerSchool(req, res) {
  const { school } = req.body || {};

  if (!school?.name || !school?.contact_email) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  try {
    const existingSchool = await pool.query(
      `
      SELECT id, status
      FROM schools
      WHERE lower(contact_email) = lower($1)
      `,
      [school.contact_email],
    );

    if (existingSchool.rows[0]) {
      return res.status(400).json({
        success: false,
        message:
          "A school access request already exists for this contact email",
        status: existingSchool.rows[0].status,
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO schools (
        name,
        addr,
        contact_email,
        contact_phone,
        status,
        admin_setup_completed
      )
      VALUES ($1, $2, $3, $4, 'PENDING', false)
      RETURNING
        id,
        name,
        addr,
        contact_email,
        contact_phone,
        status,
        admin_setup_completed,
        created_at
      `,
      [
        school.name,
        school.address ?? null,
        school.contact_email,
        school.contact_phone ?? null,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "School access request created",
      school: rows[0],
      status: rows[0].status,
    });
  } catch (e) {
    console.error("[registerSchool] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function registerMember(req, res) {
  const { name, email, password, school_id, role } = req.body || {};
  if (
    !name ||
    !email ||
    !password ||
    !school_id ||
    !["teacher", "student"].includes(role)
  ) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sch = await client.query("SELECT id FROM schools WHERE id=$1", [
      school_id,
    ]);
    if (!sch.rows[0]) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, message: "School not found" });
    }

    const ex = await client.query(
      "SELECT 1 FROM users WHERE lower(email)=lower($1)",
      [email],
    );
    if (ex.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "User exists" });
    }

    const hash = await bcryptjs.hash(password, 10);
    const u = await client.query(
      "INSERT INTO users (name,email,password_hash,is_verified) VALUES ($1,$2,$3,true) RETURNING *",
      [name, email, hash],
    );

    await client.query(
      "INSERT INTO member_req (school_id,user_id,user_role,accepted) VALUES ($1,$2,$3,false) ON CONFLICT (school_id,user_id) DO UPDATE SET user_role=$3",
      [school_id, u.rows[0].id, role],
    );

    await client.query("COMMIT");

    const full = await fetchUserWithRolesAndPending(u.rows[0].id);
    const access = issueAccess(full.user, full.roles);
    setRefreshCookie(res, full.user.id);
    return res.status(201).json({
      success: true,
      user: full.user,
      access_token: access,
      roles: full.roles,
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
}

export async function refresh(req, res) {
  const origin = req.get("origin");
  if (origin && origin !== process.env.CLIENT_URL)
    return res.status(403).json({ success: false, message: "Forbidden" });
  const rt = req.cookies?.refresh_token;
  if (!rt)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const p = jwt.verify(
      rt,
      process.env.REAL_REFRESH_SECRET || process.env.REFRESH_SECRET,
      {
        algorithms: ["HS256"],
        issuer: "your-api",
        clockTolerance: 5,
      },
    );
    const full = await fetchUserWithRolesAndPending(p.sub);
    if (!full)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    setRefreshCookie(res, full.user.id);
    const access = issueAccess(full.user, full.roles);
    return res.json({ success: true, access_token: access });
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export async function checkAuth(req, res) {
  const full = await fetchUserWithRolesAndPending(req.user.id);

  if (!full) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.json({
    success: true,
    user: full.user,
    roles: full.roles,
    school: full.school,
    pendingRequests: full.pendingRequests,
  });
}

export async function logout(_req, res) {
  clearRefreshCookie(res);
  return res.json({ success: true });
}



export async function checkOrganizationAccess(req, res) {
  const { contact_email } = req.body || {};

  if (!contact_email) {
    return res.status(400).json({
      success: false,
      message: "Missing contact email",
    });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        name,
        addr,
        contact_email,
        contact_phone,
        status,
        admin_setup_completed,
        approved_at,
        created_at
      FROM schools
      WHERE lower(contact_email) = lower($1)
      `,
      [contact_email],
    );

    const school = rows[0];

    if (!school) {
      return res.status(404).json({
        success: false,
        status: "NOT_FOUND",
        message: "No school access request found for this email",
      });
    }

    if (school.status === "PENDING") {
      return res.json({
        success: true,
        status: "PENDING",
        school,
        message: "School access request is still pending approval",
      });
    }

    if (school.status === "REJECTED") {
      return res.json({
        success: true,
        status: "REJECTED",
        school,
        message: "School access request was rejected",
      });
    }

    if (school.status === "APPROVED" && !school.admin_setup_completed) {
      return res.json({
        success: true,
        status: "NEEDS_ADMIN_SETUP",
        school,
        schoolId: school.id,
        message: "School was approved. Administrator setup is required",
      });
    }

    return res.json({
      success: true,
      status: "READY",
      school,
      schoolId: school.id,
      message: "School is ready for administrator login",
    });
  } catch (e) {
    console.error("[checkOrganizationAccess] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


export async function setupOrganizationAdmin(req, res) {
  const { school_id, admin_email, password, name } = req.body || {};

  if (!school_id || !admin_email || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const schoolQ = await client.query(
      `
      SELECT
        id,
        name,
        status,
        admin_setup_completed
      FROM schools
      WHERE id = $1
      FOR UPDATE
      `,
      [school_id],
    );

    const school = schoolQ.rows[0];

    if (!school) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    if (school.status !== "APPROVED") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        status: school.status,
        message: "School is not approved yet",
      });
    }

    if (school.admin_setup_completed) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        status: "READY",
        message: "Administrator setup was already completed",
      });
    }

    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE lower(email) = lower($1)
      `,
      [admin_email],
    );

    if (existingUser.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hash = await bcryptjs.hash(password, 10);

    const userQ = await client.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        is_verified
      )
      VALUES ($1, $2, $3, true)
      RETURNING *
      `,
      [name ?? null, admin_email, hash],
    );

    const user = userQ.rows[0];

    await client.query(
      `
      INSERT INTO memberships (
        school_id,
        user_id,
        user_role
      )
      VALUES ($1, $2, 'admin')
      `,
      [school.id, user.id],
    );

    await client.query(
      `
      UPDATE schools
      SET admin_setup_completed = true
      WHERE id = $1
      `,
      [school.id],
    );

    await client.query("COMMIT");

    const full = await fetchUserWithRolesAndPending(user.id);
    const access = issueAccess(full.user, full.roles);
    setRefreshCookie(res, full.user.id);

    return res.status(201).json({
      success: true,
      message: "Administrator account created",
      user: full.user,
      access_token: access,
      roles: full.roles,
      school: full.school,
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[setupOrganizationAdmin] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    client.release();
  }
}
export async function checkMemberInvite(req, res) {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Missing email",
    });
  }

  try {
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE lower(email) = lower($1)
      `,
      [email],
    );

    if (existingUser.rows[0]) {
      return res.json({
        success: true,
        status: "EXISTING_USER",
        message: "User already exists. Continue with password login.",
      });
    }

    const invites = await pool.query(
      `
      SELECT
        i.id,
        i.school_id,
        s.name AS school_name,
        i.email,
        i.user_role,
        i.status,
        i.created_at,
        i.expires_at
      FROM member_invites i
      JOIN schools s ON s.id = i.school_id
      WHERE lower(i.email) = lower($1)
        AND i.status = 'PENDING'
        AND (i.expires_at IS NULL OR i.expires_at > now())
      ORDER BY i.created_at DESC
      `,
      [email],
    );

    if (!invites.rows.length) {
      return res.status(404).json({
        success: false,
        status: "NOT_INVITED",
        message: "No pending invitation found for this email",
      });
    }

    if (invites.rows.length > 1) {
      return res.status(409).json({
        success: false,
        status: "MULTIPLE_INVITES",
        message: "Multiple pending invitations found for this email",
      });
    }

    return res.json({
      success: true,
      status: "INVITED",
      invite: invites.rows[0],
    });
  } catch (e) {
    console.error("[checkMemberInvite] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function acceptMemberInvite(req, res) {
  const email = normalizeEmail(req.body?.email);
  const { name, password } = req.body || {};

  if (!email || !name || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  const c = await pool.connect();

  try {
    await c.query("BEGIN");

    const invites = await c.query(
      `
      SELECT
        i.*,
        s.name AS school_name
      FROM member_invites i
      JOIN schools s ON s.id = i.school_id
      WHERE lower(i.email) = lower($1)
        AND i.status = 'PENDING'
        AND (i.expires_at IS NULL OR i.expires_at > now())
      ORDER BY i.created_at DESC
      FOR UPDATE
      `,
      [email],
    );

    if (!invites.rows.length) {
      await c.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        status: "NOT_INVITED",
        message: "No pending invitation found for this email",
      });
    }

    if (invites.rows.length > 1) {
      await c.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        status: "MULTIPLE_INVITES",
        message: "Multiple pending invitations found for this email",
      });
    }

    const invite = invites.rows[0];

    const existingUser = await c.query(
      `
      SELECT id
      FROM users
      WHERE lower(email) = lower($1)
      `,
      [email],
    );

    if (existingUser.rows[0]) {
      await c.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        status: "USER_EXISTS",
        message: "A user already exists for this email",
      });
    }

    const hash = await bcryptjs.hash(password, 10);

    const userQ = await c.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        is_verified
      )
      VALUES ($1, $2, $3, true)
      RETURNING *
      `,
      [name, email, hash],
    );

    const user = userQ.rows[0];

    await c.query(
      `
      INSERT INTO member_req (
        school_id,
        user_id,
        user_role,
        accepted
      )
      VALUES ($1, $2, $3, false)
      ON CONFLICT (school_id, user_id)
      DO UPDATE SET
        user_role = $3,
        accepted = false
      `,
      [invite.school_id, user.id, invite.user_role],
    );

    await c.query(
      `
      UPDATE member_invites
      SET
        status = 'USED',
        used_by = $1,
        used_at = now()
      WHERE id = $2
      `,
      [user.id, invite.id],
    );

    await c.query("COMMIT");

    const full = await fetchUserWithRolesAndPending(user.id);
    const access = issueAccess(full.user, full.roles);

    setRefreshCookie(res, full.user.id);

    return res.status(201).json({
      success: true,
      message: "Invite accepted. Waiting for administrator approval.",
      user: full.user,
      access_token: access,
      roles: full.roles,
      school: full.school,
      pendingRequests: full.pendingRequests,
    });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[acceptMemberInvite] failed", e);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    c.release();
  }
}