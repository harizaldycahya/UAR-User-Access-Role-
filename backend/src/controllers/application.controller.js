import { db } from "../config/db.js";

/* ================= GET ALL ================= */
export const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM applications WHERE deleted_at IS NULL"
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

/* ================= CREATE ================= */
export const createApplication = async (req, res) => {
  try {
    const { owner, code, name, url, color, icon } = req.body;

    await db.query(
      `INSERT INTO applications
       (owner, code, name, url, color, icon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [owner, code, name, url, color, icon]
    );

    res.status(201).json({
      success: true,
      message: "Application created",
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

    const allowedFields = ["owner", "name", "url", "color", "icon"];

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
