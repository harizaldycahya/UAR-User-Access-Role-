import { db } from "../config/db.js";

/* ================= GET BY APPLICATION ================= */
export const getApplicationRoles = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM application_roles
       WHERE application_id = ?
       AND deleted_at IS NULL`,
      [applicationId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET APPLICATION ROLES ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application roles",
    });
  }
};

/* ================= GET BY ID ================= */
export const getApplicationRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[role]] = await db.query(
      `SELECT *
       FROM application_roles
       WHERE id = ?
       AND deleted_at IS NULL`,
      [id]
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Application role not found",
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    console.error("GET APPLICATION ROLE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application role",
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
export const createApplicationRole = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const [[app]] = await db.query(
      "SELECT id FROM applications WHERE id = ?",
      [applicationId]
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO application_roles
        (application_id, name, description)
      VALUES (?, ?, ?)
      `,
      [applicationId, name.trim(), description || null]
    );

    const [[role]] = await db.query(
      `
      SELECT *
      FROM application_roles
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (err) {
    console.error("CREATE APPLICATION ROLE ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create application role",
    });
  }
};



/* ================= UPDATE ================= */
export const updateApplicationRole = async (req, res) => {
  try {
    const { id } = req.params;

    const fields = [];
    const values = [];
    const allowedFields = ["name", "description"];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(id);

    const [result] = await db.query(
      `
      UPDATE application_roles
      SET ${fields.join(", ")}
      WHERE id = ? AND deleted_at IS NULL
      `,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Application role not found",
      });
    }

    const [[role]] = await db.query(
      `
      SELECT *
      FROM application_roles
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    console.error("UPDATE APPLICATION ROLE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update application role",
    });
  }
};


/* ================= SOFT DELETE ================= */
export const deleteApplicationRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      UPDATE application_roles
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Application role not found",
      });
    }

    res.json({
      success: true,
      message: "Application role deleted",
    });
  } catch (err) {
    console.error("DELETE APPLICATION ROLE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete application role",
    });
  }
};
