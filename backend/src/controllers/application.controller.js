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

    const EXCLUDED_ROLES = ["CFO", "EXECUTIVE"];

    const filteredData = {
      ...response.data,
      result: {
        ...response.data.result,
        data: (response.data.result?.data ?? []).filter(
          (role) => !EXCLUDED_ROLES.includes(role.name?.toUpperCase())
        ),
      },
    };

    res.json({
      success: true,
      data: filteredData,
    });

  } catch (err) {
    console.error("GET AMS ROLES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AMS roles",
    });
  }
};

export const getAmsLocations = async (req, res) => {
  try {
    const response = await axios.get(
      process.env.AMS_URL + "/get-location",
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
    console.error("GET AMS LOCATIONS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AMS locations",
    });
  }
};

export const getCmsRoles = async (req, res) => {
  try {
    const response = await axios.get(
      process.env.CMS_URL + "/get-role",
      {
        headers: {
          Authorization: `Bearer ${process.env.CMS_API_KEY}`,
          "Accept": "application/json",
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("GET CMS ROLES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch CMS roles",
    });
  }
};

export const getSonarRoles = async (req, res) => {
  try {
    const response = await axios.get(
      "https://sonar.triasmitra.com/api/public/roles",
      {
        headers: {
          Authorization: `Bearer sonar-portal-sso-20260623-1c6a9f87c3b24d90`,
          "Accept": "application/json",
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("GET SONAR ROLES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch SONAR roles",
    });
  }
};

export const getDmsRoles = async (req, res) => {
  try {
    const token = req.headers['authorization'];

    const response = await axios.get(
      'http://35.219.106.161:8080/PatroliApi/selectQuery?param1=select user_id, username from user',
      {
        headers: {
          'Authorization': token,
        }
      }
    );

    // Transform data supaya strukturnya sama seperti IMS/CMS roles
    const rawData = response.data;

    // Sesuaikan mapping ini dengan struktur response PatroliApi yang asli
    const transformedData = (rawData?.data || rawData || []).map((item) => ({
      id: item.user_id,
      name: item.username,
    }));

    res.json({
      success: true,
      data: {
        success: true,
        code: 200,
        result: {
          data: transformedData,
        },
      },
    });

  } catch (err) {
    console.error("GET DMS ROLES ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch DMS roles",
      error: err.message,
    });
  }
};

export const getQmsRoles = async (req, res) => {
  try {
    const token = req.headers['authorization'];

    const response = await axios.get(
      'http://35.219.106.161:8080/PatroliApi/selectQuery?param1=select user_id, username from user',
      {
        headers: {
          'Authorization': token,
        }
      }
    );

    // Transform data supaya strukturnya sama seperti IMS/CMS roles
    const rawData = response.data;

    // Sesuaikan mapping ini dengan struktur response PatroliApi yang asli
    const transformedData = (rawData?.data || rawData || []).map((item) => ({
      id: item.user_id,
      name: item.username,
    }));

    res.json({
      success: true,
      data: {
        success: true,
        code: 200,
        result: {
          data: transformedData,
        },
      },
    });

  } catch (err) {
    console.error("GET QMS ROLES ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch QMS roles",
      error: err.message,
    });
  }
};

const AUTO_ACCESS_CODES = ["hris", "shocart", "helpdesk"];

export const redirectToApplication = async (req, res) => {
  let baseUrl = "";
  let token = "";
  let targetIdentifier = "";

  try {
    const username = String(req.user.username).trim();
    const nik = username;
    const rawCode = req.params.code;
    const code = rawCode.trim().toLowerCase();

    if (code === "hris" || code === "hrisnew") {
      baseUrl = "https://personasys.triasmitra.com";
      token = "9592fabb0d0a7f63c913c3828ba0c895472e14668720a5018662390829c085c9";
    } else if (code === "ams") {
      baseUrl = "https://ams.triasmitra.com";
      token = "iCI0YUAb0hu+2HF62lR_xs9FUsguF3OI6BqU2O33vP46fq$AO42UAE647vCeu4Shxfw";
    } else if (code === "ims") {
      baseUrl = "https://ims.triasmitra.com";
      token = "KFhNebzV8EvLWTyWYZ0XPKafNGDwtANTN7WzZtka_TfGTqPQtmANLiRfMtCI8JKyxg9";
    } else if (code === "cms") {
      baseUrl = "https://cms.triasmitra.com";
      token = "9e6d3c1f7a4b8d2e5f1c9a7b3e6d4f8a2c1e7b9d5f3a6c8e4b1d7a2f9c6e3b5";
    } else if (code === "aas") {
      baseUrl = "https://aas.triasmitra.com";
      token = "a3f9d2b4c1e6f7890a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef";
    } else if (code === "qms") {
      baseUrl = "https://qms.triasmitra.com";
      token = "9f3c8a1d7e4b2f5a6c0d1e8b3a9f7c24e5d6b8a1c3f9e0d7a2b4c6e8f1a3d5b7";
    } else if (code === "shocart") {
      baseUrl = "https://shocart.triasmitra.com";
      token = "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f9012345678901";
    } else if (code === "helpdesk") {
      baseUrl = "https://helpdesk.triasmitra.com";
      token = "9fA7kLm2QxP8vZr4Tn6YwB1cHdE5uJ0s";
    } else if (code === "campers") {
      baseUrl = "https://campers.triasmitra.com";
      token = "ddMhiXpxw0pAEuX2FXSzsaC5kN9yZM2qz8eBGby6oL3gYFh4WWM8ZEnNVHFNRHOr";
    } else if (code === "das") {
      baseUrl = "https://das.triasmitra.com";
      token = "8f8cba9716432668d1c4c5c660e3254ab44cf2064ea7c2bb0904cce6654661b0";
    } else if (code === "dms") {
      baseUrl = "http://devdms.triasmitra.com";
      token = "7e316e87289439e98139ef8d0a0c11ea3a611032d40f4876df9e237b0e385e59";
    } else if (code === "sonar") {
      baseUrl = "http://sonar.triasmitra.com";
      token = "sonar-portal-sso-20260623-1c6a9f87c3b24d90";
    } else {
      return res.status(404).json({
        success: false,
        message: "Application not supported",
      });
    }

    console.log("=== DEBUG SSO ===");
    console.log("username from token:", username);
    console.log("code from params:", code);

    let access;

    if (AUTO_ACCESS_CODES.includes(code)) {
      // Auto access — skip pengecekan user_applications
      access = { id: null, role_name: null };
    } else {
      const [[found]] = await db.query(
        `
          SELECT ua.id, ua.role_name
          FROM user_applications ua
          JOIN applications a 
            ON a.id = ua.application_id
          WHERE TRIM(LOWER(ua.username)) = TRIM(LOWER(?))
            AND TRIM(LOWER(a.code)) = TRIM(LOWER(?))
          LIMIT 1
        `,
        [username, code]
      );

      if (!found) {
        return res.status(403).json({
          success: false,
          message: "Akses aplikasi ditolak",
        });
      }

      access = found;
    }

    console.log("access result:", access);

    // ✅ QMS pakai role_name sebagai identifier, lainnya pakai NIK
    targetIdentifier = (code === "qms" || code === "dms") ? access.role_name : nik;

    console.log("Calling API:", `${baseUrl}/api/public/get-token/${targetIdentifier}`);
    console.log("With token:", token);

    const response = await axios.get(
      `${baseUrl}/api/public/get-token/${targetIdentifier}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("API status:", response.status);
    console.log("API response:", JSON.stringify(response.data));

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
          id: access.role_id ?? null,
          name: access.role_name ?? username,
        },
      },
    });
  } catch (err) {
    console.error("SSO REDIRECT ERROR:", err.response?.data || err.message);
    console.error("SSO REDIRECT STATUS:", err.response?.status);
    console.error("SSO REDIRECT URL:", err.config?.url);

    return res.status(500).json({
      success: false,
      message: "Gagal melakukan redirect SSO",
      _debug: {
        error_message: err.message,
        error_status: err.response?.status ?? null,
        error_url: err.config?.url ?? null,
        error_response: err.response?.data ?? null,
        target_identifier: targetIdentifier,
        base_url: baseUrl,
      }
    });
  }
};