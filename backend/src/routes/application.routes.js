import express from "express";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

// 🔒 semua route di bawah ini butuh token
router.use(authMiddleware);

router.get("/", getApplications);
router.get("/:id", getApplicationById);
router.post("/",roleMiddleware(["admin"]),  createApplication);
router.put("/:id",roleMiddleware(["admin"]),  updateApplication);
router.delete("/:id",roleMiddleware(["admin"]),  deleteApplication);

export default router;
