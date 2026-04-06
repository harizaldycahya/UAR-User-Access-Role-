import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db.js";
import axios from "axios";

// Helper sama persis seperti di auth.controller.js
const getEmailFromHR = async (nik) => {
  try {
    const res = await axios.get(
      "https://personasys.triasmitra.com/api/auth/get-profile-uar",
      { params: { nik }, timeout: 5000 }
    );
    if (res.data?.Success && res.data?.data?.email) {
      return res.data.data.email;
    }
    return null;
  } catch (err) {
    console.error("HR API ERROR:", err.message);
    return null;
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails[0].value;

        // 1. Ambil semua user aktif dari DB
        const [users] = await db.query(
          `SELECT 
            u.id,
            u.username,
            u.role_id,
            u.last_login_at,
            u.last_login_ip,
            r.code AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.is_active = 1`,
        );

        if (users.length === 0) {
          return done(null, false, { message: "Tidak ada user aktif" });
        }

        // 2. Loop user, cek email dari HR API satu per satu
        let matchedUser = null;
        for (const user of users) {
          const hrEmail = await getEmailFromHR(user.username);
          if (hrEmail && hrEmail.toLowerCase() === googleEmail.toLowerCase()) {
            matchedUser = user;
            break;
          }
        }

        if (!matchedUser) {
          return done(null, false, { message: "Email Google tidak terdaftar di sistem" });
        }

        return done(null, matchedUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;