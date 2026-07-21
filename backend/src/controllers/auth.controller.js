import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import axios from "axios";
import crypto from "crypto";
import { transporter } from "../config/mailer.js";


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
      u.last_login_at,
      u.last_login_ip,
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

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Password salah" });
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role_id: user.role_id,
  });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // ✅ FIX: dynamic, bukan hardcoded false
  });

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role_name,
      last_login_at: user.last_login_at,
      last_login_ip: user.last_login_ip,
    },
  });
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const currentIp =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    const [result] = await db.query(
      `
      UPDATE users
      SET last_login_at = ?,
          last_login_ip = ?
      WHERE id = ?
      `,
      [now, currentIp, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User tidak ditemukan saat logout" });
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ message: "Logout berhasil" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ message: "Gagal logout" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.nama_user,
        u.is_active,
        u.role_id,
        r.code AS role_name,
        u.created_at,
        u.updated_at,
        u.last_password_changed_at,
        u.last_login_at,
        u.last_login_ip
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = 1
       LIMIT 1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const nik = user.username;

    let hrProfile = null;
    let photoUrl = null;

    try {
      const hrRes = await axios.get(
        "https://personasys.triasmitra.com/api/auth/get-profile-uar",
        { params: { nik }, timeout: 5000 }
      );

      if (hrRes.data?.Success) {
        hrProfile = hrRes.data.data;

        try {
          const photoRes = await axios.get(
            "https://personasys.triasmitra.com/api/aas-gateway/get-photo-url",
            { params: { nik }, timeout: 5000 }
          );

          if (photoRes.data?.Success) {
            photoUrl = photoRes.data.photo_url;
          }
        } catch (photoErr) {
          console.error("PHOTO API ERROR:", photoErr.message);
        }
      }
    } catch (apiErr) {
      console.error("HR API ERROR:", apiErr.message);
    }

    return res.json({
      user,
      hr_profile: hrProfile,
      photo_url: photoUrl,
    });
  } catch (err) {
    console.error("AUTH ME ERROR:", err);
    return res.status(500).json({
      message: "Gagal mengambil data user",
    });
  }
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

    const [[user]] = await db.query(
      `SELECT password FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!user || !user.password) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Password lama salah",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users 
      SET password = ?, 
          updated_at = NOW(),
          last_password_changed_at = NOW()
      WHERE id = ?`,
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

// ─── Konfigurasi nodemailer ────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ─── Helper: ambil email dari HR API ──────────────────────────
const getEmailFromHR = async (nik) => {
  try {
    const res = await axios.get(
      "https://personasys.triasmitra.com/api/auth/get-profile-uar",
      { params: { nik }, timeout: 5000 }
    );
    if (res.data?.Success && res.data?.data?.email) {
      return res.data.data.email;
    }
    return null;
  } catch (err) {
    console.error("HR API ERROR (getEmailFromHR):", err.message);
    return null;
  }
};

// ================================================================
// 1. FORGOT PASSWORD
//    POST /api/auth/forgot-password
//    Body: { username }
// ================================================================


export const forgotPassword = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username wajib diisi." });
  }

  try {
    const [rows] = await db.query(
      `SELECT username FROM users WHERE username = ? AND is_active = 1 LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Jika username terdaftar, link reset akan dikirimkan ke email kamu.",
      });
    }

    const email = await getEmailFromHR(username);

    if (!email) {
      console.log("[ForgotPW] ⚠️ email kosong dari HR API, stop di sini");
      return res.status(503).json({
        message: "Gagal mengambil data email dari sistem HR. Silakan hubungi IT Support.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(`DELETE FROM password_reset_tokens WHERE username = ?`, [username]);

    await db.query(
      `INSERT INTO password_reset_tokens (username, token, expires_at) VALUES (?, ?, ?)`,
      [username, token, expiresAt]
    );

    // ✅ FIX: pakai env variable, bukan hardcoded localhost
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log("[ForgotPW] mencoba sendMail ke:", email);
    await transporter.sendMail({
      from: `"Portal Triasmitra" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Password - Portal Triasmitra",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;
                    background: #ffffff; border: 1px solid #e5e7eb;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
            Reset Password Kamu
          </h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px 0;">
            Halo <strong>${username}</strong>,
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
            Kami menerima permintaan reset password untuk akunmu di Portal Triasmitra.
          </p>
          <a href="${resetLink}"
            style="display: inline-block; padding: 12px 24px; background: #2563eb;
                   color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Link ini kadaluarsa dalam <strong>1 jam</strong>.
            Jika kamu tidak meminta reset password, abaikan email ini.
          </p>
        </div>
      `,
    });

    // ✅ FIX: hapus field "email" dari response
    return res.status(200).json({
      message: "Jika username terdaftar, link reset akan dikirimkan ke email kamu.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    // ✅ FIX: hapus debug_error dan debug_stack
    return res.status(500).json({
      message: "Terjadi kesalahan server.",
    });
  }
};

// ================================================================
// 2. VERIFY RESET TOKEN
//    GET /api/auth/verify-reset-token?token=xxx
// ================================================================
export const verifyResetToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token tidak ditemukan." });
  }

  try {
    const [rows] = await db.query(
      `SELECT username, expires_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token tidak valid." });
    }

    const isExpired = new Date() > new Date(rows[0].expires_at);
    if (isExpired) {
      await db.query(`DELETE FROM password_reset_tokens WHERE token = ?`, [token]);
      return res.status(400).json({ message: "Token sudah kadaluarsa." });
    }

    return res.status(200).json({ message: "Token valid." });
  } catch (err) {
    console.error("VERIFY RESET TOKEN ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ================================================================
// 3. RESET PASSWORD
//    POST /api/auth/reset-password
//    Body: { token, newPassword }
// ================================================================
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token dan password wajib diisi." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter." });
  }

  try {
    const [rows] = await db.query(
      `SELECT username, expires_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token tidak valid." });
    }

    const isExpired = new Date() > new Date(rows[0].expires_at);
    if (isExpired) {
      await db.query(`DELETE FROM password_reset_tokens WHERE token = ?`, [token]);
      return res.status(400).json({ message: "Token sudah kadaluarsa." });
    }

    const { username } = rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
       SET password = ?,
           updated_at = NOW(),
           last_password_changed_at = NOW()
       WHERE username = ?`,
      [hashedPassword, username]
    );

    await db.query(`DELETE FROM password_reset_tokens WHERE token = ?`, [token]);

    return res.status(200).json({ message: "Password berhasil diperbarui." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};