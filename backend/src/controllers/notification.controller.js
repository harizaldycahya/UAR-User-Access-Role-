// controllers/notification.controller.js

import { db } from "../config/db.js";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────
//  EXISTING — notifications (aplikasi lain)
// ─────────────────────────────────────────────────────────────────

export const createNotification = async (req, res) => {
  const {
    username,
    app_code,
    content,
    url,
    notification_date,
  } = req.body;

  if (!username || !app_code || !content) {
    return res.status(400).json({
      message: "username, app_code, dan content wajib",
    });
  }

  const date = notification_date
    ? new Date(notification_date)
    : new Date();

  await db.query(
    `
    INSERT INTO notifications
      (username, app_code, content, url, notification_date)
    VALUES (?, ?, ?, ?, ?)
    `,
    [username, app_code, content, url || null, date]
  );

  return res.json({
    message: "Notification created",
  });
};

export const getMyNotifications = async (req, res) => {
  const username = req.user.username;

  const [rows] = await db.query(
    `
    SELECT
      id,
      app_code,
      content,
      url,
      notification_date,
      is_read
    FROM notifications
    WHERE username = ? AND deleted_at IS NULL
    ORDER BY notification_date DESC
    LIMIT 50
    `,
    [username]
  );

  return res.json({
    data: rows,
  });
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  await db.query(
    `
    UPDATE notifications
    SET is_read = 1, read_at = NOW()
    WHERE id = ? AND username = ?
    `,
    [id, username]
  );

  res.json({ message: "Marked as read" });
};

// ─────────────────────────────────────────────────────────────────
//  UAR — uar_notifications
// ─────────────────────────────────────────────────────────────────

// Internal helper — dipanggil dari controller approval/rejection UAR
// Contoh:
//   import { triggerApprovalNotification } from "./notification.controller.js";
//   await triggerApprovalNotification({
//     username      : "budi.santoso",
//     type          : "approval",
//     title         : "Pengajuan Cuti Disetujui",
//     content       : "Pengajuan cuti 17–18 Mar telah disetujui.",
//     url           : "/uar/cuti/123",
//     reference_id  : "123",
//     reference_type: "pengajuan_cuti",
//   });

export const triggerApprovalNotification = async ({
  username,
  type,
  title,
  content,
  url = null,
  reference_id = null,
  reference_type = null,
  send_email = false,
}) => {
  if (!username || !type || !title || !content) {
    throw new Error("username, type, title, dan content wajib diisi");
  }

  // 1. Simpan notifikasi in-app
  await db.query(
    `INSERT INTO uar_notifications
      (username, type, title, content, url, reference_id, reference_type, notification_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [username, type, title, content, url, reference_id, reference_type]
  );

  // 2. Kirim email kalau diminta
  if (send_email) {
    const [[user]] = await db.query(
      `SELECT email FROM users WHERE username = ? LIMIT 1`,
      [username]
    );

    if (user?.email) {
      const { subject, html } = approvalEmailTemplate({ username, type, title, content, url });

      // Fire-and-forget, biar gak block proses utama
      transporter
        .sendMail({
          from: `"Portal Triasmitra" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html,
        })
        .catch((err) =>
          console.error(`[Email Notif] Gagal kirim ke ${user.email}:`, err.message)
        );
    }
  }
};

// GET /api/notifications/uar
export const getUarNotifications = async (req, res) => {
  const username = req.user.username;

  const [rows] = await db.query(
    `
    SELECT
      id, type, title, content, url,
      reference_id, reference_type,
      is_read, read_at, notification_date
    FROM uar_notifications
    WHERE username = ? AND deleted_at IS NULL
    ORDER BY notification_date DESC
    LIMIT 50
    `,
    [username]
  );

  const unread_count = rows.filter((r) => !r.is_read).length;

  return res.json({ data: rows, unread_count });
};

// PATCH /api/notifications/uar/read-all
export const markAllUarNotificationsRead = async (req, res) => {
  const username = req.user.username;

  const [result] = await db.query(
    `
    UPDATE uar_notifications
    SET is_read = 1, read_at = NOW()
    WHERE username = ? AND is_read = 0
    `,
    [username]
  );

  return res.json({
    message: "Semua notifikasi UAR ditandai sudah dibaca",
    updated: result.affectedRows,
  });
};

// PATCH /api/notifications/uar/:id/read
export const markUarNotificationRead = async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  const [result] = await db.query(
    `
    UPDATE uar_notifications
    SET is_read = 1, read_at = NOW()
    WHERE id = ? AND username = ? AND is_read = 0
    `,
    [id, username]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      message: "Notifikasi tidak ditemukan atau sudah dibaca",
    });
  }

  return res.json({ message: "Notifikasi ditandai sudah dibaca" });
};

export const markUarNotificationByReference = async (req, res) => {
  const username = req.user.username;

  const {
    reference_id,
    reference_type,
  } = req.body;

  if (!reference_id || !reference_type) {
    return res.status(400).json({
      message: "reference_id dan reference_type wajib",
    });
  }

  const [result] = await db.query(
    `
    UPDATE uar_notifications
    SET is_read = 1,
        read_at = NOW()
    WHERE username = ?
      AND reference_id = ?
      AND reference_type = ?
      AND is_read = 0
    `,
    [username, reference_id, reference_type]
  );

  return res.json({
    message: "Notification marked as read by reference",
    updated: result.affectedRows,
  });
};

export const clearAllUarNotifications = async (req, res) => {
  const username = req.user.username;

  const [result] = await db.query(
    `
    UPDATE uar_notifications
    SET deleted_at = NOW()
    WHERE username = ? AND deleted_at IS NULL
    `,
    [username]
  );

  return res.json({
    message: "Semua notifikasi UAR berhasil dihapus",
    deleted: result.affectedRows,
  });
};

export const clearAllNotifications = async (req, res) => {
  const username = req.user.username;

  const [result] = await db.query(
    `
    UPDATE notifications
    SET deleted_at = NOW()
    WHERE username = ? AND deleted_at IS NULL
    `,
    [username]
  );

  return res.json({
    message: "All notifications cleared",
    deleted: result.affectedRows,
  });
};