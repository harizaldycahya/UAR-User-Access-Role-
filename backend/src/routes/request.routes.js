import express from "express";
import { createRequest,getMyRequests,getMyApprovals, getRequestDetail, approvalAction } from "../controllers/request.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", authMiddleware, createRequest);
router.get("/me", authMiddleware, getMyRequests);
router.get("/approvals/me", authMiddleware, getMyApprovals);
router.post("/approvals/action", authMiddleware, approvalAction);
router.get("/:code", authMiddleware, getRequestDetail);


export default router;
