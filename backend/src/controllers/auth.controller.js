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
      u.role_id,
      r.code AS role_name
   FROM users u
   JOIN roles r ON r.id = u.role_id
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
    role_id: user.role_id,
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
      role_id: user.role_id,
      role_name: user.role_name,
    },
  });
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Password lama dan password baru wajib diisi",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password baru minimal 8 karakter",
      });
    }

    // ambil password lama dari DB
    const [[user]] = await db.query(
      `SELECT password FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!user || !user.password) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // cek password lama
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Password lama salah",
      });
    }

    // hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password
    await db.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, userId]
    );

    return res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Gagal mengubah password",
    });
  }
};

