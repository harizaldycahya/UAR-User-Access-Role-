import express from "express";
import {
  getUsers,
  getUserByUsername
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", roleMiddleware([1]), getUsers);
router.get("/:username", roleMiddleware([1]), getUserByUsername);

export default router;
