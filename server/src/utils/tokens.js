import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

export function issueAccess(user, roles = []) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, roles },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m", issuer: "your-api" }
  );
}

export function setRefreshCookie(res, userId) {
  const token = jwt.sign(
    { sub: String(userId) },
    process.env.REAL_REFRESH_SECRET || process.env.REFRESH_SECRET,
    {
      expiresIn: "30d",
      issuer: "your-api",
    }
  );
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax", 
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.cookie("rt_demo", "present", {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  res.clearCookie("rt_demo", {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

