import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ada" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded biasanya cuma { id: ... }
    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Token tidak valid" });
    }

    // ambil username dari DB
    const [[user]] = await db.query(
      `SELECT id, username FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    // set user lengkap
    req.user = {
      id: user.id,
      username: user.username,
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ message: "Token tidak valid" });
  }
};
