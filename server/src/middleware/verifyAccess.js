import jwt from "jsonwebtoken";

export function verifyAccess(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(/\s+/);
  if (!/^Bearer$/i.test(scheme) || !token)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const p = jwt.verify(token, process.env.ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: "your-api",
      clockTolerance: 5,
    });
    req.user = { id: p.sub };
    req.roles = Array.isArray(p.roles) ? p.roles : [];
    next();
  } catch (e) {
    console.log("verifyAccess - error")
    return res
      .status(401)
      .json({
        success: false,
        message:
          e.name === "TokenExpiredError" ? "TokenExpired" : "Unauthorized",
      });
  }
}

export function requireAdmin(_req, res, next) {
  return (_req.roles || []).includes("admin")
    ? next()
    : res.status(403).json({ success: false, message: "Forbidden" });
}
