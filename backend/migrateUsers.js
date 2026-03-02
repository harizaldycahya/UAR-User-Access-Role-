import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = "2026rising8";

const appMapping = {
  ims: 1,
  ams: 2,
  hris: 3,
  helpdesk: 4,
  cms: 5,
  aas: 6,
  dms: 7,
  shocart: 8,
  das: 9,
  rms: 10,
  qms: 11
};

async function migrate() {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "uar"
  });

  console.log("ambil data tb_user...");

  const [users] = await db.query(`SELECT * FROM tb_user`);

  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  for (const user of users) {

    const username = user.id_user;
    const nama = user.nama_user;

    console.log("migrating:", username);

    // insert ke users
    await db.query(`
      INSERT INTO users
      (
        username,
        nama_user,
        password,
        is_active,
        role_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, 1, 2, NOW(), NOW())
      ON DUPLICATE KEY UPDATE username=username
    `, [
      username,
      nama,
      defaultHash
    ]);

    // cek aplikasi
    for (const key in appMapping) {

      if (user[key] === 1 || user[key] === "1") {

        const applicationId = appMapping[key];

        await db.query(`
          INSERT INTO user_applications
          (
            username,
            application_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, NOW(), NOW())
        `, [
          username,
          applicationId
        ]);

      }
    }

  }

  console.log("migrasi selesai. akhirnya.");
  process.exit();
}

migrate();