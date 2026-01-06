import { db } from "../config/db.js";

// GET all applications
export const getApplications = async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM applications WHERE deleted_at IS NULL"
  );

  res.json({ success: true, data: rows });
};

// GET by id
export const getApplicationById = async (req, res) => {
  const { id } = req.params;

  const [[app]] = await db.query(
    "SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL",
    [id]
  );

  if (!app) {
    return res.status(404).json({ message: "Application not found" });
  }

  res.json({ success: true, data: app });
};

// CREATE
export const createApplication = async (req, res) => {
  const { is_accessible, owner, code, name, url, color, icon } = req.body;

  await db.query(
    `INSERT INTO applications 
    (is_accessible, owner, code, name, url, color, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [is_accessible, owner, code, name, url, color, icon]
  );

  res.status(201).json({ success: true, message: "Application created" });
};

// UPDATE
export const updateApplication = async (req, res) => {
  const { id } = req.params;
  const { is_accessible, owner, name, url, color, icon } = req.body;

  await db.query(
    `UPDATE applications 
     SET is_accessible=?, owner=?, name=?, url=?, color=?, icon=?
     WHERE id=?`,
    [is_accessible, owner, name, url, color, icon, id]
  );

  res.json({ success: true, message: "Application updated" });
};

// SOFT DELETE
export const deleteApplication = async (req, res) => {
  const { id } = req.params;

  await db.query(
    "UPDATE applications SET deleted_at = NOW() WHERE id = ?",
    [id]
  );

  res.json({ success: true, message: "Application deleted" });
};
