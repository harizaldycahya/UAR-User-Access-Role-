import { db } from "../config/db.js";
import axios from "axios";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `
      SELECT 
        u.id,
        u.username,
        u.nama_user,
        u.is_active,
        u.role_id,
        r.code AS role_name,
        u.created_at,
        u.last_login_at,
        u.last_login_ip
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
      `
    );

    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data users",
    });
  }
};


export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const [[user]] = await db.query(
      `
      SELECT 
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
      WHERE u.username = ?
      LIMIT 1
      `,
      [username]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
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
      success: true,
      data: {
        user,
        hr_profile: hrProfile,
        photo_url: photoUrl,
      },
    });
  } catch (err) {
    console.error("GET USER DETAIL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail user",
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter",
      });
    }

    // cek user ada atau tidak
    const [[user]] = await db.query(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // update password
    await db.query(
      `
      UPDATE users 
      SET password = ?, 
          last_password_changed_at = NOW(),
          updated_at = NOW()
      WHERE username = ?
      `,
      [hashedPassword, username]
    );

    return res.json({
      success: true,
      message: `Password user ${username} berhasil direset`,
    });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Gagal reset password",
    });
  }
};


