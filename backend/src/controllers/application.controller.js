import { db } from "../config/db.js";
import axios from "axios";

const APP_CONFIG = {
  HRIS: {
    token: process.env.HRIS_TOKEN,
    base_url: "https://personasys.triasmitra.com",
  },
  AMS: {
    token: process.env.AMS_TOKEN,
    base_url: "https://ams.triasmitra.com",
  },
  IMS: {
    token: process.env.IMS_TOKEN,
    base_url: "https://ims.triasmitra.com",
  },
};


/* ================= GET ALL ================= */
export const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM applications WHERE deleted_at IS NULL ORDER BY code ASC"
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET APPLICATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

/* ================= GET BY ID ================= */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[app]] = await db.query(
      "SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: app,
    });
  } catch (err) {
    console.error("GET APPLICATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

/* ================= GET BY CODE ================= */
export const getApplicationByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [[app]] = await db.query(
      `
      SELECT *
      FROM applications
      WHERE code = ?
      AND deleted_at IS NULL
      `,
      [code]
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: app,
    });
  } catch (err) {
    console.error("GET APPLICATION BY CODE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

/* ================= CREATE ================= */
export const createApplication = async (req, res) => {
  try {
    const { owner, code, name, url, color, icon } = req.body;

    const [result] = await db.query(
      `INSERT INTO applications
      (owner, code, name, url, color, icon)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [owner, code, name, url, color, icon]
    );

    const insertedId = result.insertId;

    const [rows] = await db.query(
      `SELECT * FROM applications WHERE id = ?`,
      [insertedId]
    );

    res.status(201).json({
      success: true,
      message: "Application created",
      data: rows[0],
    });
  } catch (err) {
    console.error("CREATE APPLICATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create application",
    });
  }
};

/* ================= UPDATE ================= */
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const fields = [];
    const values = [];

    const allowedFields = [
      "owner",
      "name",
      "url",
      "color",
      "icon",
    ];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE applications
       SET ${fields.join(", ")}
       WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application updated",
    });
  } catch (err) {
    console.error("UPDATE APPLICATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

/* ================= SOFT DELETE ================= */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE applications
       SET deleted_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application deleted",
    });
  } catch (err) {
    console.error("DELETE APPLICATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
    });
  }
};

export const getImsRoles = async (req, res) => {
  try {
    const response = await axios.get(
      process.env.IMS_URL + "/get-hierarchy",
      {
        headers: {
          Authorization: `Bearer ${process.env.IMS_API_KEY}`,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("IMS ERROR STATUS:", err.response?.status);
    console.error("IMS ERROR DATA:", err.response?.data);
    console.error("IMS ERROR MESSAGE:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch IMS roles",
    });
  }
};

export const getAmsRoles = async (req, res) => {
  try {
    const response = await axios.get(
      process.env.AMS_URL + "/get-role",
      {
        headers: {
          Authorization: `Bearer ${process.env.AMS_API_KEY}`,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("GET AMS ROLES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AMS roles",
    });
  }
};

// export const redirectToApplication = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { code } = req.params;

//     const [[app]] = await db.query(
//       `
//       SELECT a.url
//       FROM applications a
//       JOIN user_applications ua
//         ON ua.application_id = a.id
//       WHERE ua.username = ?
//         AND a.code = ?
//       LIMIT 1
//       `,
//       [userId, code]
//     );

//     if (!app) {
//       return res.status(403).json({
//         success: false,
//         message: "Akses aplikasi ditolak",
//       });
//     }

//     return res.json({
//       success: true,
//       redirect_url: app.url,
//     });
//   } catch (err) {
//     console.error("REDIRECT ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Gagal melakukan redirect",
//     });
//   }
// };

// export const redirectToApplication = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const nik = req.user.nik;
//     const { code } = req.params;

//     const config = APP_CONFIG[code];

//     if (!config) {
//       return res.status(404).json({
//         success: false,
//         message: "Application not supported",
//       });
//     }

//     // cek akses + ambil role
//     const [[access]] = await db.query(
//       `
//       SELECT ar.id AS role_id, ar.name AS role_name
//       FROM user_applications ua
//       JOIN application_roles ar 
//         ON ar.id = ua.application_roles_id
//       JOIN applications a 
//         ON a.id = ua.application_id
//       WHERE ua.username = ?
//         AND a.code = ?
//       LIMIT 1
//       `,
//       [userId, code]
//     );

//     if (!access) {
//       return res.status(403).json({
//         success: false,
//         message: "Akses aplikasi ditolak",
//       });
//     }

//     // call external SSO API
//     const response = await axios.get(
//       `${config.base_url}/api/public/get-token/${nik}`,
//       {
//         headers: {
//           Authorization: `Bearer ${config.token}`,
//         },
//       }
//     );

//     const accessToken = response.data?.result?.access_token;

//     if (!accessToken) {
//       return res.status(403).json({
//         success: false,
//         message: "User tidak memiliki akun di aplikasi tujuan",
//       });
//     }

//     return res.json({
//       success: true,
//       data: {
//         redirect_url: `${config.base_url}/sso/${accessToken}`,
//         application: code.toUpperCase(),
//         role: {
//           id: access.role_id,
//           name: access.role_name,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("SSO REDIRECT ERROR:", err.message);

//     return res.status(500).json({
//       success: false,
//       message: "Gagal melakukan redirect SSO",
//     });
//   }
// };

export const redirectToApplication = async (req, res) => {
  try {
    const username = String(req.user.username).trim();
    const nik = username; // kalau memang NIK = username
    const rawCode = req.params.code;
    const code = rawCode.trim().toLowerCase();

    // mapping hardcode sementara
    let baseUrl = "";
    let token = "";

    if (code === "hris" || code === "hrisnew") {
      baseUrl = "https://personasys.triasmitra.com";
      token = "9592fabb0d0a7f63c913c3828ba0c895472e14668720a5018662390829c085c9";
    } else if (code === "ams") {
      baseUrl = "https://ams.triasmitra.com";
      token = "iCI0YUAb0hu+2HF62lR_xs9FUsguF3OI6BqU2O33vP46fq$AO42UAE647vCeu4Shxfw";
    } else if (code === "ims") {
      baseUrl = "https://ims.triasmitra.com";
      token = "KFhNebzV8EvLWTyWYZ0XPKafNGDwtANTN7WzZtka_TfGTqPQtmANLiRfMtCI8JKyxg9";
    } else {
      return res.status(404).json({
        success: false,
        message: "Application not supported",
      });
    }

    console.log("=== DEBUG SSO ===");
    console.log("username from token:", username);
    console.log("code from params:", code);

    // cek akses user berdasarkan username
    const [[access]] = await db.query(
      `
        SELECT ua.id
        FROM user_applications ua
        JOIN applications a 
          ON a.id = ua.application_id
        WHERE TRIM(LOWER(ua.username)) = TRIM(LOWER(?))
          AND TRIM(LOWER(a.code)) = TRIM(LOWER(?))
        LIMIT 1
      `,
      [username, code]
    );

    if (!access) {
      return res.status(403).json({
        success: false,
        message: "Akses aplikasi ditolak",
      });
    }

    // call external SSO API
    const response = await axios.get(
      `${baseUrl}/api/public/get-token/${nik}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const accessToken = response.data?.result?.access_token;

    if (!accessToken) {
      return res.status(403).json({
        success: false,
        message: "User tidak memiliki akun di aplikasi tujuan",
      });
    }

    return res.json({
      success: true,
      data: {
        redirect_url: `${baseUrl}/sso/${accessToken}`,
        application: code.toUpperCase(),
        role: {
          id: access.role_id,
          name: access.role_name,
        },
      },
    });
  } catch (err) {
    console.error("SSO REDIRECT ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Gagal melakukan redirect SSO",
    });
  }
};

