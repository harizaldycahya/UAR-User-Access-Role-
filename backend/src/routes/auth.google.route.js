// routes/auth.google.route.js
import express from "express";
import passport from "../config/passport.config.js";
import { signToken } from "../utils/jwt.js"; // sesuaikan path signToken kamu

const router = express.Router();

// Step 1: Redirect ke Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"], session: false })
);

// Step 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=unauthorized` }),
  (req, res) => {
    const user = req.user;

    // Buat JWT internal — sama persis seperti login biasa
    const token = signToken({
      id: user.id,
      username: user.username,
      role_id: user.role_id,
    });

    // Redirect ke frontend dengan token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
      }))}`
    );
  }
);

export default router;