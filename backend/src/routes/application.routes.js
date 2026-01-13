import express from "express";
import {
  getApplications,
  getApplicationById,
  getApplicationByCode,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getApplications);
router.get("/by-code/:code", getApplicationByCode);
router.get("/:id", getApplicationById);

router.post("/", roleMiddleware(["admin"]), createApplication);
router.put("/:id", roleMiddleware(["admin"]), updateApplication);
router.delete("/:id", roleMiddleware(["admin"]), deleteApplication);

export default router;
