import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db.js";

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

        // Langsung query by email — tidak perlu hit HR API sama sekali
        const [rows] = await db.query(
          `SELECT 
            u.id,
            u.username,
            u.role_id,
            u.last_login_at,
            u.last_login_ip,
            r.code AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.email = ? AND u.is_active = 1
           LIMIT 1`,
          [googleEmail]
        );

        if (rows.length === 0) {
          return done(null, false, { message: "Email tidak terdaftar di sistem" });
        }

        return done(null, rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;