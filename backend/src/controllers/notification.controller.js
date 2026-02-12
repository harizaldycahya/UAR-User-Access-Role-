import { db } from "../config/db.js";
import axios from "axios";

export const createNotification = async (req, res) => {
  const {
    username,
    app_code,
    content,
    url,                // ⬅️ NEW
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
    [
      username,
      app_code,
      content,
      url || null,      // ⬅️ aman kalau nggak dikirim
      date
    ]
  );

  return res.json({
    message: "Notification created",
  });
};

export const getMyNotifications = async (req, res) => {
  const username = req.user.username; // dari JWT middleware

  const [rows] = await db.query(
    `
    SELECT
      id,
      app_code,
      content,
      url,                -- ⬅️ NEW
      notification_date,
      is_read
    FROM notifications
    WHERE username = ?
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
