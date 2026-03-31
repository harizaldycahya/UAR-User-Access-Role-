// routes/notification.routes.js

import express from "express";
import {
  // Outside app
  createNotification,
  getMyNotifications,
  markNotificationRead,
  // UAR
  getUarNotifications,
  markAllUarNotificationsRead,
  markUarNotificationRead,
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

/**
 * =========================
 * UAR NOTIFICATIONS
 * =========================
 */
router.get   ("/uar",          authMiddleware, getUarNotifications);
router.patch ("/uar/read-all", authMiddleware, markAllUarNotificationsRead);
router.patch ("/uar/:id/read", authMiddleware, markUarNotificationRead);

export default router;