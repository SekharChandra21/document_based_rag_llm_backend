import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

export const verifyN8N = (req, res, next) => {
  console.log("\n🔐 N8N Auth Check:");
  console.log("   Authorization header:", req.headers.authorization ? "Present" : "Missing");
  
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("❌ N8N Auth Failed: No Bearer token");
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];
  console.log("   Token received:", token.substring(0, 10) + "...");
  console.log("   Expected token:", process.env.N8N_SECRET_TOKEN ? process.env.N8N_SECRET_TOKEN.substring(0, 10) + "..." : "NOT SET");

  if (token !== process.env.N8N_SECRET_TOKEN) {
    console.log("❌ N8N Auth Failed: Token mismatch");
    return res.status(403).json({ error: "Invalid token" });
  }

  console.log("✅ N8N Auth Successful");
  next();
};
