import express from "express";
import {
  getApplications,
  getApplicationById,
  getApplicationByCode,
  createApplication,
  updateApplication,
  deleteApplication,
  getImsRoles,
  getAmsRoles,
} from "../controllers/application.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getApplications);
router.get("/by-code/:code", getApplicationByCode);

router.get("/integrations/ims/roles", getImsRoles);
router.get("/integrations/ams/roles", getAmsRoles);

router.get("/:id", getApplicationById);

router.post("/", roleMiddleware([1]), createApplication);
router.put("/:id", roleMiddleware([1]), updateApplication);
router.delete("/:id", roleMiddleware([1]), deleteApplication);


export default router;
