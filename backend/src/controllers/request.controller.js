import { db } from "../config/db.js";
import axios from "axios";

import {
  getApprovalWithLock,
  getMinPendingLevel,
  handleReject,
  getPendingCount,
  getRequestInfo,
  applyRoleChanges,
  notifyExternalApp,
} from "../helpers/approvalHelpers.js";

export const createRequest = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const username = req.user.username;

    const {
      application_id,
      type,
      old_role_id,
      old_role_name,
      new_role_id,
      new_role_name,
      notes,
      justification,
    } = req.body;

    // =========================
    // 1) Check role_mode aplikasi
    // =========================
    const [[appData]] = await conn.query(
      `SELECT role_mode FROM applications WHERE id = ?`,
      [application_id]
    );

    const isDynamic = appData?.role_mode === "dynamic";

    // =========================
    // 2) Basic Validation
    // =========================
    if (!application_id || !type || !justification) {
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

    if (isDynamic && !notes) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Notes is required for this application",
      });
    }

    if (!isDynamic && (!new_role_id || !new_role_name)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Role data is required",
      });
    }

    if (type === "change_role" && !isDynamic && (!old_role_id || !old_role_name)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Old role data is required for change role request",
      });
    }

    // =========================
    // 3) Check Existing Pending
    // =========================
    const [[existing]] = await conn.query(
      `
      SELECT id
      FROM requests
      WHERE username = ?
        AND application_id = ?
        AND status = 'pending'
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [username, application_id]
    );

    if (existing) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this application",
      });
    }

    // =========================
    // 4) Insert Request
    // =========================
    const [result] = await conn.query(
      `
      INSERT INTO requests
        (username, application_id, type, old_role_id, old_role_name, new_role_id, new_role_name, notes, justification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        username,
        application_id,
        type,
        old_role_id || null,
        old_role_name || null,
        isDynamic ? null : (new_role_id || null),
        isDynamic ? null : (new_role_name || null),
        isDynamic ? notes : null,
        justification,
      ]
    );

    const requestId = result.insertId;

    // =========================
    // 5) Generate Request Code
    // =========================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const yearMonth = `${year}${month}`;
    const prefix = type === "change_role" ? "CR" : "AR";

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
      const lastSeq = last.request_code.split("-")[2];
      sequence = parseInt(lastSeq) + 1;
    }

    const paddedSeq = String(sequence).padStart(4, "0");
    const requestCode = `${prefix}-${yearMonth}-${paddedSeq}`;

    await conn.query(
      `UPDATE requests SET request_code = ? WHERE id = ?`,
      [requestCode, requestId]
    );

    // =========================
    // 6) Personasys (username = NIK)
    // =========================
    const nik = username;

    const personaRes = await axios.get(
      "https://personasys.triasmitra.com/api/auth/get-approval-uar",
      {
        params: { nik },
        timeout: 10000,
      }
    );

    if (!personaRes.data?.Success) {
      await conn.rollback();
      return res.status(500).json({
        success: false,
        message: "Failed to get approver data from personasys",
      });
    }

    const atasanId = personaRes.data.data?.atasan1_general || null;

    if (!atasanId) {
      await conn.rollback();
      return res.status(500).json({
        success: false,
        message: "Approver not found from personasys",
      });
    }

    // HRD
    const [[hrd]] = await conn.query(
      `SELECT username AS approver_id FROM users WHERE role_id = '3' LIMIT 1`
    );

    // App Owner
    const [[appOwner]] = await conn.query(
      `SELECT owner AS approver_id FROM applications WHERE id = ?`,
      [application_id]
    );

    const approvers = [
      { level: 1, approver_id: atasanId },
      { level: 2, approver_id: hrd?.approver_id },
      { level: 3, approver_id: appOwner?.approver_id },
    ];

    for (const a of approvers) {
      if (!a.approver_id) {
        await conn.rollback();
        return res.status(500).json({
          success: false,
          message: `Missing approver for level ${a.level}`,
        });
      }
    }

    // =========================
    // 7) Insert Approvals
    // =========================
    const approvalQuery = `
      INSERT INTO approvals (request_code, level, approver_id, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `;

    for (const a of approvers) {
      await conn.query(approvalQuery, [requestCode, a.level, a.approver_id]);
    }

    // =========================
    // 8) Final Response
    // =========================
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
    const username = req.user.username; // 👈 sumber kebenaran

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.request_code,
        r.type,
        r.justification,
        r.notes,
        r.status,
        r.created_at,

        a.id AS application_id,
        a.name AS application_name,
        a.role_mode AS application_role_mode,

        r.old_role_id,
        r.old_role_name,

        r.new_role_id,
        r.new_role_name,

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

      WHERE r.username = ?

      ORDER BY r.created_at DESC, ap.level ASC
      `,
      [username]
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
          notes: row.notes,
          status: row.status,
          created_at: row.created_at,

          application: {
            id: row.application_id,
            name: row.application_name,
            role_mode: row.application_role_mode,
          },

          old_role_id: row.old_role_id,
          old_role_name: row.old_role_name,
          new_role_id: row.new_role_id,
          new_role_name: row.new_role_name,

          approvals: [],
        };

        map.set(row.request_code, request);
        result.push(request);
      }

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

export const getRequestDetail = async (req, res) => {
  try {
    const username = req.user.username;
    const { code } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.request_code,
        r.type,
        r.justification,
        r.notes,
        r.status,
        r.created_at,

        a.id   AS application_id,
        a.name AS application_name,
        a.role_mode AS application_role_mode,

        -- SNAPSHOT FIELD
        r.old_role_id,
        r.old_role_name,

        r.new_role_id,
        r.new_role_name,

        ap.id          AS approval_id,
        ap.level       AS approval_level,
        ap.approver_id,
        u.nama_user    AS approver_name,
        ap.status      AS approval_status,
        ap.created_at  AS approval_created_at

      FROM requests r
      JOIN applications a
        ON a.id = r.application_id

      LEFT JOIN approvals ap
        ON ap.request_code = r.request_code

      LEFT JOIN users u
        ON u.username COLLATE utf8mb4_general_ci
         = ap.approver_id COLLATE utf8mb4_general_ci

      WHERE r.username COLLATE utf8mb4_general_ci = ?
        AND r.request_code = ?

      ORDER BY ap.level ASC
      `,
      [username, code]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const first = rows[0];

    const result = {
      id: first.id,
      request_code: first.request_code,
      type: first.type,
      justification: first.justification,
      notes: first.notes,
      status: first.status,
      created_at: first.created_at,

      application: {
        id: first.application_id,
        name: first.application_name,
        role_mode: first.application_role_mode,
      },

      // SNAPSHOT RESPONSE (flat, sesuai frontend)
      old_role_id: first.old_role_id,
      old_role_name: first.old_role_name,

      new_role_id: first.new_role_id,
      new_role_name: first.new_role_name,

      approvals: [],
    };

    for (const row of rows) {
      if (row.approval_id) {
        result.approvals.push({
          id: row.approval_id,
          level: row.approval_level,
          approver_id: row.approver_id,
          approver_name: row.approver_name,
          status: row.approval_status,
          created_at: row.approval_created_at,
        });
      }
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("GET REQUEST DETAIL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      sqlMessage: err.sqlMessage,
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
          r.notes,
          r.status,
          r.created_at,

          a.id AS application_id,
          a.name AS application_name,
          a.role_mode AS application_role_mode,

          r.old_role_id,
          r.old_role_name,

          r.new_role_id,
          r.new_role_name

        FROM approvals ap

        JOIN requests r
          ON r.request_code = ap.request_code

        JOIN applications a
          ON a.id = r.application_id

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
    const username = req.user.username;
    const { approval_id, action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action tidak valid" });
    }

    await conn.beginTransaction();

    const approval = await getApprovalWithLock(conn, approval_id, username);
    if (!approval) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Approval tidak ditemukan" });
    }

    if (approval.status !== "pending") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Approval sudah diproses" });
    }

    const minLevel = await getMinPendingLevel(conn, approval.request_code);
    if (approval.level !== minLevel) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Approval harus diproses berurutan" });
    }

    if (action === "reject") {
      await handleReject(conn, approval);
      await conn.commit();
      return res.json({ success: true, message: "Request ditolak" });
    }

    // approve
    await conn.query(
      `UPDATE approvals SET status = 'approved', approved_at = NOW() WHERE id = ?`,
      [approval.id]
    );

    const pendingCount = await getPendingCount(conn, approval.request_code);
    if (pendingCount === 0) {
      await conn.query(
        `UPDATE requests SET status = 'approved' WHERE request_code = ?`,
        [approval.request_code]
      );

      const request = await getRequestInfo(conn, approval.request_code);
      await applyRoleChanges(conn, request);
      // Hit external API di luar transaksi, supaya kalau gagal tidak rollback DB
      await notifyExternalApp(request);

      await conn.commit();
    } else {
      await conn.commit();
    }

    res.json({ success: true, message: "Approval berhasil" });

  } catch (err) {
    await conn.rollback();
    console.error("APPROVAL ACTION ERROR:", err);
    res.status(500).json({ success: false, message: "Gagal memproses approval" });
  } finally {
    conn.release();
  }
};

// export const approvalAction = async (req, res) => {
//   const conn = await db.getConnection();

//   try {
//     const username = req.user.username;
//     const { approval_id, action } = req.body;

//     if (!["approve", "reject"].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: "Action tidak valid",
//       });
//     }

//     await conn.beginTransaction();

//     // ambil approval yang mau diproses
//     const [[approval]] = await conn.query(
//       `
//       SELECT *
//       FROM approvals
//       WHERE id = ?
//         AND approver_id = ?
//       FOR UPDATE
//       `,
//       [approval_id, username]
//     );

//     if (!approval) {
//       await conn.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Approval tidak ditemukan",
//       });
//     }

//     if (approval.status !== "pending") {
//       await conn.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Approval sudah diproses",
//       });
//     }

//     // cek level terkecil yang masih pending
//     const [[minLevel]] = await conn.query(
//       `
//       SELECT MIN(level) AS min_level
//       FROM approvals
//       WHERE request_code = ?
//         AND status = 'pending'
//       `,
//       [approval.request_code]
//     );

//     if (approval.level !== minLevel.min_level) {
//       await conn.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Approval harus diproses berurutan",
//       });
//     }

//     const approvalStatus = action === "approve" ? "approved" : "rejected";

//     await conn.query(
//       `
//       UPDATE approvals
//       SET status = ?, approved_at = NOW()
//       WHERE id = ?
//       `,
//       [approvalStatus, approval.id]
//     );

//     if (action === "reject") {
//       await conn.query(
//         `UPDATE requests SET status = 'rejected' WHERE request_code = ?`,
//         [approval.request_code]
//       );

//       await conn.query(
//         `
//         UPDATE approvals
//         SET status = 'rejected'
//         WHERE request_code = ?
//           AND status = 'pending'
//         `,
//         [approval.request_code]
//       );

//       await conn.commit();

//       return res.json({
//         success: true,
//         message: "Request ditolak",
//       });
//     }

//     // cek apakah masih ada pending
//     const [[pending]] = await conn.query(
//       `
//       SELECT COUNT(*) AS total
//       FROM approvals
//       WHERE request_code = ?
//         AND status = 'pending'
//       `,
//       [approval.request_code]
//     );

//     if (pending.total === 0) {
//       await conn.query(
//         `UPDATE requests SET status = 'approved' WHERE request_code = ?`,
//         [approval.request_code]
//       );

//       const [[request]] = await conn.query(
//         `
//     SELECT
//       r.username,
//       r.application_id,
//       r.old_role_id,
//       r.new_role_id,
//       r.type
//     FROM requests r
//     WHERE r.request_code = ?
//     `,
//         [approval.request_code]
//       );

//       if (request.type === "application_access") {
//         await conn.query(
//           `
//       INSERT INTO user_applications
//         (username, application_id, application_roles_id, created_at)
//       VALUES (?, ?, ?, NOW())
//       `,
//           [
//             request.username,
//             request.application_id,
//             request.new_role_id
//           ]
//         );
//       }

//       if (request.type === "change_role") {
//         const [result] = await conn.query(
//           `
//       UPDATE user_applications
//       SET application_roles_id = ?, updated_at = NOW()
//       WHERE username = ?
//         AND application_id = ?
//         AND application_roles_id = ?
//       `,
//           [
//             request.new_role_id,
//             request.username,
//             request.application_id,
//             request.old_role_id
//           ]
//         );

//         if (result.affectedRows === 0) {
//           throw new Error("User application tidak ditemukan untuk change role");
//         }
//       }
//     }

//     await conn.commit();

//     res.json({
//       success: true,
//       message: "Approval berhasil",
//     });

//   } catch (err) {
//     await conn.rollback();
//     console.error("APPROVAL ACTION ERROR:", err);

//     res.status(500).json({
//       success: false,
//       message: "Gagal memproses approval",
//     });
//   } finally {
//     conn.release();
//   }
// };

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
        r.notes,
        r.created_at,

        a.name AS application_name,
        a.role_mode AS application_role_mode,

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
