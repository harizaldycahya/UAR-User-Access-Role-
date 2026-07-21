// routes/notification.routes.js

import express from "express";
import {
  // Outside app
  createNotification,
  getMyNotifications,
  markNotificationRead,
  clearAllNotifications, 
  // UAR
  getUarNotifications,
  markAllUarNotificationsRead,
  markUarNotificationRead,
  clearAllUarNotifications
} from "../controllers/notification.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { serviceAuthMiddleware } from "../middleware/service.middleware.js";

const router = express.Router();

/**
 * =========================
 * SERVICE → PORTAL
 * =========================
 */
router.post(
  "/",
  serviceAuthMiddleware,
  createNotification
);

/**
 * =========================
 * USER → PORTAL
 * =========================
 */
router.get(
  "/me",
  authMiddleware,
  getMyNotifications
);

router.patch(
  "/:id/read",
  authMiddleware,
  markNotificationRead
);

router.delete(
  "/me/clear",
  authMiddleware,
  clearAllNotifications
);


/**
 * =========================
 * UAR NOTIFICATIONS
 * =========================
 */
router.get   ("/uar",          authMiddleware, getUarNotifications);
router.patch ("/uar/read-all", authMiddleware, markAllUarNotificationsRead);
router.patch ("/uar/:id/read", authMiddleware, markUarNotificationRead);
router.delete("/uar/clear-all", authMiddleware, clearAllUarNotifications);

export default router;