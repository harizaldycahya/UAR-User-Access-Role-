import { db } from "../src/config/db.js";
import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

const syncEmails = async () => {
  const [users] = await db.query(
    `SELECT id, username FROM users WHERE is_active = 1 AND email IS NULL`
  );

  console.log(`Syncing ${users.length} users...`);

  for (const user of users) {
    try {
      const res = await axios.get(
        "https://personasys.triasmitra.com/api/auth/get-profile-uar",
        { params: { nik: user.username }, timeout: 10000, httpsAgent: agent }
      );

      if (res.data?.Success && res.data?.data?.email) {
        const email = res.data.data.email;
        await db.query(`UPDATE users SET email = ? WHERE id = ?`, [email, user.id]);
        console.log(`✅ ${user.username} → ${email}`);
      } else {
        console.log(`⚠️  ${user.username} → email tidak ditemukan`);
      }
    } catch (err) {
      console.log(`❌ ${user.username} → ${err.message}`);
    }
  }

  console.log("\nDone!");
  process.exit(0);
};

syncEmails();