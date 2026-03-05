import express from "express";
import { 
    login, 
    logout, 
    changePassword, 
    me,
    forgotPassword,      
    verifyResetToken,    
    resetPassword,       
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware,me);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password",forgotPassword);
router.get("/verify-reset-token",verifyResetToken);
router.post("/reset-password",resetPassword);

export default router;
