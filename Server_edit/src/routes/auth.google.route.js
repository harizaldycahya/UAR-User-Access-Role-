// routes/auth.google.route.js
import express from "express";
import passport from "../config/passport.config.js";
import { signToken } from "../utils/jwt.js";

const router = express.Router();

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Step 1: Redirect ke Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
    prompt: "select_account",
  })
);

// Step 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=unauthorized`,
  }),
  (req, res) => {
    const user = req.user;

    const token = signToken({
      id: user.id,
      username: user.username,
      role_id: user.role_id,
    });

    // ✅ Set httpOnly cookie langsung di sini — token tidak pernah muncul di URL
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",   // "lax" karena ini cross-site redirect dari Google
      secure: IS_PRODUCTION,
    });

    // ✅ Redirect hanya bawa role_name untuk keperluan redirect di frontend
    // Tidak ada token, tidak ada data sensitif di URL
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?role=${user.role_name}`
    );
  }
);

export default router;