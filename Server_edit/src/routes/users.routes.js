import express from "express";
import {
  getUsers,
  getUserByUsername,
  resetPassword,
  createUser
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { serviceAuthMiddleware } from "../middleware/service.middleware.js";

const router = express.Router();

router.post("/create", serviceAuthMiddleware, createUser); 

router.use(authMiddleware);
router.get("/", roleMiddleware([1]), getUsers);
router.get("/:username", roleMiddleware([1]), getUserByUsername);
router.post(
  "/:username/reset-password",
  roleMiddleware([1]), // hanya admin
  resetPassword
);

export default router;
