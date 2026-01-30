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


    // =========================
    // Generate Request Code
    // =========================

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 01 - 12

    const yearMonth = `${year}${month}`;

    // Tentuin prefix dari type
    const prefix = type === "change_role" ? "CR" : "AR";

    // Ambil nomor terakhir di bulan ini + tipe ini
    const [[last]] = await conn.query(
      `
        SELECT request_code
        FROM requests
        WHERE request_code LIKE ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [`${prefix}-${yearMonth}-%`]
    );

    let sequence = 1;

    if (last?.request_code) {
      const lastSeq = last.request_code.split("-")[2]; // 000123
      sequence = parseInt(lastSeq) + 1;
    }

    // Pad jadi 4 digit
    const paddedSeq = String(sequence).padStart(4, "0");

    // Final code
    const requestCode = `${prefix}-${yearMonth}-${paddedSeq}`;

    // Simpan ke DB
    await conn.query(
      `UPDATE requests SET request_code = ? WHERE id = ?`,
      [requestCode, requestId]
    );


    // ================================
    // 2) Ambil 4 approver (contoh logika)
    // Sesuaikan dengan tabelmu, ini cuma template
    // ================================

    // const [[atasan]] = await conn.query(
    //   `SELECT atasan AS approver_id FROM users WHERE id = ?`,
    //   [userId]
    // );
    const atasan = {
      approver_id: 'KT-23031284'   // pastikan user ID ini ADA di tabel users
    };

    const kadiv = {
      approver_id: 'KT-18040465'   // pastikan user ID ini ADA di tabel users
    };

    const [[hrd]] = await conn.query(
      `SELECT username AS approver_id FROM users WHERE role = '3' LIMIT 1`
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
      (request_code, level, approver_id, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `;

    for (const a of approvers) {
      await conn.query(approvalQuery, [
        requestCode,
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
        r.request_code,
        r.type,
        r.justification,
        r.status,
        r.created_at,

        a.id AS application_id,
        a.name AS application_name,

        old_role.id AS old_role_id,
        old_role.name AS old_role_name,

        new_role.id AS new_role_id,
        new_role.name AS new_role_name,

        ap.id AS approval_id,
        ap.level AS approval_level,
        ap.approver_id,
        ap.status AS approval_status,
        ap.created_at AS approval_created_at

      FROM requests r

      JOIN applications a
        ON a.id = r.application_id

      LEFT JOIN application_roles old_role
        ON old_role.id = r.old_role_id

      LEFT JOIN application_roles new_role
        ON new_role.id = r.new_role_id

      LEFT JOIN approvals ap
        ON ap.request_code = r.request_code

      WHERE r.user_id = ?

      ORDER BY r.created_at DESC, ap.level ASC
      `,
      [userId]
    );

    // =========================
    // GROUPING DI NODEJS
    // =========================

    const result = [];

    const map = new Map();

    for (const row of rows) {
      if (!map.has(row.request_code)) {
        const request = {
          id: row.id,
          request_code: row.request_code,
          type: row.type,
          justification: row.justification,
          status: row.status,
          created_at: row.created_at,

          application: {
            id: row.application_id,
            name: row.application_name,
          },

          old_role: row.old_role_id
            ? {
              id: row.old_role_id,
              name: row.old_role_name,
            }
            : null,

          new_role: {
            id: row.new_role_id,
            name: row.new_role_name,
          },

          approvals: [],
        };

        map.set(row.request_code, request);
        result.push(request);
      }

      // Kalau ada approval → push
      if (row.approval_id) {
        map.get(row.request_code).approvals.push({
          id: row.approval_id,
          level: row.approval_level,
          approver_id: row.approver_id,
          status: row.approval_status,
          created_at: row.approval_created_at,
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
    });
  }
};

// GET /api/requests/:code
export const getRequestDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.request_code,
        r.type,
        r.justification,
        r.status,
        r.created_at,

        a.id AS application_id,
        a.name AS application_name,

        old_role.id AS old_role_id,
        old_role.name AS old_role_name,

        new_role.id AS new_role_id,
        new_role.name AS new_role_name,

        ap.id AS approval_id,
        ap.level AS approval_level,
        ap.approver_id,
        ap.status AS approval_status,
        ap.created_at AS approval_created_at

      FROM requests r

      JOIN applications a
        ON a.id = r.application_id

      LEFT JOIN application_roles old_role
        ON old_role.id = r.old_role_id

      LEFT JOIN application_roles new_role
        ON new_role.id = r.new_role_id

      LEFT JOIN approvals ap
        ON ap.request_code = r.request_code

      WHERE r.user_id = ?
        AND r.request_code = ?

      ORDER BY ap.level ASC
      `,
      [userId, code]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // ======================
    // FORMAT RESPONSE
    // ======================

    const first = rows[0];

    const result = {
      id: first.id,
      request_code: first.request_code,
      type: first.type,
      justification: first.justification,
      status: first.status,
      created_at: first.created_at,

      application: {
        id: first.application_id,
        name: first.application_name,
      },

      old_role: first.old_role_id
        ? {
          id: first.old_role_id,
          name: first.old_role_name,
        }
        : null,

      new_role: first.new_role_id
        ? {
          id: first.new_role_id,
          name: first.new_role_name,
        }
        : null,

      approvals: [],
    };

    for (const row of rows) {
      if (row.approval_id) {
        result.approvals.push({
          id: row.approval_id,
          level: row.approval_level,
          approver_id: row.approver_id,
          status: row.approval_status,
          created_at: row.approval_created_at,
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("GET REQUEST DETAIL ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch request detail",
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
          r.request_code,
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
          ON r.request_code = ap.request_code

        JOIN applications a
          ON a.id = r.application_id

        LEFT JOIN application_roles old_role
          ON old_role.id = r.old_role_id

        LEFT JOIN application_roles new_role
          ON new_role.id = r.new_role_id

        WHERE ap.approver_id = ?
        AND ap.status = 'pending'

        AND NOT EXISTS (
          SELECT 1
          FROM approvals prev
          WHERE prev.request_code = ap.request_code
            AND prev.level < ap.level
            AND prev.status != 'approved'
        )

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

export const approvalAction = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const userId = req.user.id;
    const { approval_id, action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action tidak valid",
      });
    }

    // ambil username approver
    const [[user]] = await conn.query(
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

    await conn.beginTransaction();

    // ambil approval yang mau diproses
    const [[approval]] = await conn.query(
      `
      SELECT *
      FROM approvals
      WHERE id = ?
        AND approver_id = ?
      FOR UPDATE
      `,
      [approval_id, username]
    );

    if (!approval) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Approval tidak ditemukan",
      });
    }

    if (approval.status !== "pending") {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Approval sudah diproses",
      });
    }

    // cek level terkecil yang masih pending
    const [[minLevel]] = await conn.query(
      `
      SELECT MIN(level) AS min_level
      FROM approvals
      WHERE request_code = ?
        AND status = 'pending'
      `,
      [approval.request_code]
    );

    if (approval.level !== minLevel.min_level) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Approval harus diproses berurutan",
      });
    }

    // update approval
    const approvalStatus = action === "approve" ? "approved" : "rejected";

    await conn.query(
      `
      UPDATE approvals
      SET status = ?, approved_at = NOW()
      WHERE id = ?
      `,
      [approvalStatus, approval.id]
    );

    // kalau reject → request langsung rejected + kunci approval lain
    if (action === "reject") {
      await conn.query(
        `
        UPDATE requests
        SET status = 'rejected'
        WHERE request_code = ?
        `,
        [approval.request_code]
      );

      await conn.query(
        `
        UPDATE approvals
        SET status = 'rejected'
        WHERE request_code = ?
          AND status = 'pending'
        `,
        [approval.request_code]
      );

      await conn.commit();
      return res.json({
        success: true,
        message: "Request ditolak",
      });
    }

    // cek apakah masih ada pending
    const [[pending]] = await conn.query(
      `
      SELECT COUNT(*) AS total
      FROM approvals
      WHERE request_code = ?
        AND status = 'pending'
      `,
      [approval.request_code]
    );

    // kalau tidak ada pending → request approved
    if (pending.total === 0) {
      await conn.query(
        `UPDATE requests SET status = 'approved' WHERE request_code = ?`,
        [approval.request_code]
      );

      const [[request]] = await conn.query(
        `
        SELECT
          user_id,
          application_id,
          old_role_id,
          new_role_id,
          type
        FROM requests
        WHERE request_code = ?
        `,
        [approval.request_code]
      );

      if (request.type === "application_access") {
        // INSERT akses baru
        await conn.query(
          `
          INSERT INTO user_applications
            (user_id, application_id, application_roles_id, created_at)
          VALUES (?, ?, ?, NOW())
          `,
          [
            request.user_id,
            request.application_id,
            request.new_role_id
          ]
        );
      }

      if (request.type === "change_role") {
        // UPDATE role existing
        const [result] = await conn.query(
          `
          UPDATE user_applications
          SET application_roles_id = ?, updated_at = NOW()
          WHERE user_id = ?
            AND application_id = ?
            AND application_roles_id = ?
          `,
          [
            request.new_role_id,
            request.user_id,
            request.application_id,
            request.old_role_id
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error("User application tidak ditemukan untuk change role");
        }
      }
    }


    await conn.commit();

    res.json({
      success: true,
      message: "Approval berhasil",
    });
  } catch (err) {
    await conn.rollback();
    console.error("APPROVAL ACTION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Gagal memproses approval",
    });
  } finally {
    conn.release();
  }
};

export const getMyApprovalHistory = async (req, res) => {
  try {
    const userId = req.user.id;

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

    const [rows] = await db.query(
      `
      SELECT
        ap.id AS approval_id,
        ap.level,
        ap.status AS approval_status,
        ap.approved_at,

        r.request_code,
        r.type,
        r.justification,
        r.created_at,

        a.name AS application_name,

        old_role.name AS old_role_name,
        new_role.name AS new_role_name

      FROM approvals ap
      JOIN requests r ON r.request_code = ap.request_code
      JOIN applications a ON a.id = r.application_id
      LEFT JOIN application_roles old_role ON old_role.id = r.old_role_id
      LEFT JOIN application_roles new_role ON new_role.id = r.new_role_id

      WHERE ap.approver_id = ?
        AND ap.status IN ('approved', 'rejected')

      ORDER BY ap.approved_at DESC
      `,
      [user.username]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approval history",
    });
  }
};



