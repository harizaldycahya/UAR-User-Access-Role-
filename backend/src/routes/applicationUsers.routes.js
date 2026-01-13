import express from "express";
import {
  getApplicationsByUser,
  checkApplicationAccess,
} from "../controllers/application_users.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getApplicationsByUser);

router.get(
  "/:application_id/open",
  authMiddleware,
  checkApplicationAccess,
  (req, res) => {
    res.json({ message: "Akses aplikasi diterima" });
  }
);

export default router;
