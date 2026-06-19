import express from "express";
import { createRequest,getMyRequests,getMyApprovals, getMyApprovalHistory, getRequestDetail, approvalAction, reviseRequest } from "../controllers/request.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", authMiddleware, createRequest);
router.get("/me", authMiddleware, getMyRequests);
router.get("/approvals/me", authMiddleware, getMyApprovals);
router.get("/approvals/me/history", authMiddleware, getMyApprovalHistory);
router.post("/approvals/action", authMiddleware, approvalAction);
router.get("/:code", authMiddleware, getRequestDetail);
router.patch("/:request_code/revise", authMiddleware, reviseRequest);


export default router;
