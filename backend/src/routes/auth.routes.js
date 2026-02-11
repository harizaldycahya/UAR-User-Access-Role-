import express from "express";
import { login, changePassword, me } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware,me);
router.post("/change-password", authMiddleware, changePassword);

export default router;
