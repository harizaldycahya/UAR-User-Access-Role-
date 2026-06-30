import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {

  console.log("HIT authMiddleware");
  // ✅ Baca dari cookie, bukan Authorization header
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ada" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role_id: decoded.role_id,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Token tidak valid" });
  }
};