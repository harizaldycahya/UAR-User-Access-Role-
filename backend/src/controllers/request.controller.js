import { db } from "../config/db.js";

export const createRequest = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const userId = req.user.id;
    const {
      application_id,
      type,
      old_role_id,
      new_role_id,
      justification,
    } = req.body;

    if (!application_id || !type || !new_role_id || !justification) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Incomplete request data",
      });
    }

    if (!["application_access", "change_role"].includes(type)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid request type",
      });
    }

    // cek pending dulu, biar nggak spam
    const [[existing]] = await conn.query(
      `
      SELECT id
      FROM requests
      WHERE user_id = ?
        AND application_id = ?
        AND status = 'pending'
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [userId, application_id]
    );

    if (existing) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this application",
      });
    }

    // 1) Insert request dulu
    const [result] = await conn.query(
      `
      INSERT INTO requests
        (user_id, application_id, type, old_role_id, new_role_id, justification)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        application_id,
        type,
        old_role_id || null,
        new_role_id,
        justification,
      ]
    );

    const requestId = result.insertId;

    // ================================
    // 2) Ambil 4 approver (contoh logika)
    // Sesuaikan dengan tabelmu, ini cuma template
    // ================================

    const [[atasan]] = await conn.query(
      `SELECT atasan AS approver_id FROM users WHERE id = ?`,
      [userId]
    );

    const kadiv = {
      approver_id: 'KADIV'   // pastikan user ID ini ADA di tabel users
    };

    const [[hrd]] = await conn.query(
      `SELECT username AS approver_id FROM users WHERE role_id = '3' LIMIT 1`
    );

    const [[appOwner]] = await conn.query(
      `SELECT owner AS approver_id 
       FROM applications 
       WHERE id = ?`,
      [application_id]
    );

    const approvers = [
      { level: 1, approver_id: atasan?.approver_id },
      { level: 2, approver_id: kadiv?.approver_id },
      { level: 3, approver_id: hrd?.approver_id },
      { level: 4, approver_id: appOwner?.approver_id },
    ];

    // cek kalau ada yang kosong, biar nggak nabrak
    for (const a of approvers) {
      if (!a.approver_id) {
        await conn.rollback();
        return res.status(500).json({
          success: false,
          message: `Missing approver for level ${a.level}`,
        });
      }
    }

    // 3) Insert ke approvals (4 baris)
    const approvalQuery = `
      INSERT INTO approvals
      (request_id, level, approver_id, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `;

    for (const a of approvers) {
      await conn.query(approvalQuery, [
        requestId,
        a.level,
        a.approver_id,
      ]);
    }

    // 4) Ambil request final
    const [[request]] = await conn.query(
      `SELECT * FROM requests WHERE id = ?`,
      [requestId]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      data: request,
      approvals: approvers,
    });

  } catch (err) {
    await conn.rollback();
    console.error("CREATE REQUEST ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to create request",
      error: err.code || null,
    });
  } finally {
    conn.release();
  }
};


export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.type,
        r.justification,
        r.status,
        r.created_at,

        a.id AS application_id,
        a.name AS application_name,

        old_role.id AS old_role_id,
        old_role.name AS old_role_name,

        new_role.id AS new_role_id,
        new_role.name AS new_role_name

      FROM requests r
      JOIN applications a
        ON a.id = r.application_id

      LEFT JOIN application_roles old_role
        ON old_role.id = r.old_role_id

      LEFT JOIN application_roles new_role
        ON new_role.id = r.new_role_id

      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
    });
  }
};

export const getMyApprovals = async (req, res) => {
  try {
    const userId = req.user.id;

    // ambil username approver
    const [[user]] = await db.query(
      `SELECT username FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const username = user.username;


    
    console.log("APPROVER USER:", user);
    console.log("APPROVER_ID PARAM:", username);

    const [rows] = await db.query(
      `
      SELECT
        ap.id AS approval_id,
        ap.level,
        ap.status AS approval_status,

        r.id AS id,
        r.type,
        r.justification,
        r.status,
        r.created_at,

        a.id AS application_id,
        a.name AS application_name,

        old_role.id AS old_role_id,
        old_role.name AS old_role_name,

        new_role.id AS new_role_id,
        new_role.name AS new_role_name

      FROM approvals ap
      JOIN requests r
        ON r.id = ap.request_id

      JOIN applications a
        ON a.id = r.application_id

      LEFT JOIN application_roles old_role
        ON old_role.id = r.old_role_id

      LEFT JOIN application_roles new_role
        ON new_role.id = r.new_role_id

      WHERE ap.approver_id = ?
      ORDER BY r.created_at DESC
      `,
      [username]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("GET MY APPROVALS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approvals",
    });
  }
};



