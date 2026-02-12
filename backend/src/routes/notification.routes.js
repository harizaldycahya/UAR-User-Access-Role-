// routes/notification.routes.js

import express from "express";
import {
  createNotification,
  getMyNotifications,
  markNotificationRead
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

export default router;
