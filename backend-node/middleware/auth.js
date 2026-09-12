const jwt = require("jsonwebtoken");

// Fail loudly at startup rather than silently signing tokens with a
// fallback secret that anyone reading this source could forge.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Add it to backend-node/.env before starting the server."
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "12h";

// In-memory revocation list — fine for a single Node instance. If you run
// more than one instance behind a load balancer, move this to Redis (or a
// shared store) so a logout on one instance revokes the token everywhere.
const revokedTokens = new Set();

function signAdminToken(admin) {
  return jwt.sign({ sub: admin._id.toString(), username: admin.username, role: "admin" }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

function revokeToken(token) {
  revokedTokens.add(token);
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: "Session has been logged out" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") throw new Error("Not an admin token");
    req.admin = payload;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session, please log in again" });
  }
}

module.exports = { signAdminToken, requireAdmin, revokeToken, TOKEN_TTL };
