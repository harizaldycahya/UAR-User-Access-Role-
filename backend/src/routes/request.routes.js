import express from "express";
import { createRequest,getMyRequests } from "../controllers/request.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", authMiddleware, createRequest);
router.get("/me", authMiddleware, getMyRequests);

export default router;
