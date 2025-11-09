import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ ok: false });

    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch {
    res.status(401).json({ ok: false });
  }
}
