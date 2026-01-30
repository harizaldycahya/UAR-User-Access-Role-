import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib" });
  }

  const [rows] = await db.query(
    `SELECT 
        u.id,
        u.username,
        u.password,
        r.code AS role
     FROM users u
     JOIN roles r ON r.id = u.role
     WHERE u.username = ? AND u.is_active = 1
     LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: "User tidak ditemukan" });
  }

  const user = rows[0];

  if (!user.password) {
    return res.status(500).json({ message: "Password user rusak" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Password salah" });
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
};
