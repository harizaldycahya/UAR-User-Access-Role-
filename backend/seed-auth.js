import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { db } from "./src/config/db.js";

dotenv.config();

const seedAuth = async () => {
  try {
    // 1️⃣ roles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2️⃣ users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255),
        role_id INT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_role
          FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    // 3️⃣ roles data
    await db.query(`
      INSERT IGNORE INTO roles (id, code, name) VALUES
      (1, 'admin', 'Administrator'),
      (2, 'user', 'User')
    `);

    // 4️⃣ users data
    const adminPass = await bcrypt.hash("admin123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    await db.query(
      `INSERT IGNORE INTO users (id, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [1, "admin", adminPass, 1]
    );

    await db.query(
      `INSERT IGNORE INTO users (id, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [2, "user", userPass, 2]
    );

    console.log("Seeder auth selesai");
    process.exit();
  } catch (err) {
    console.error("Seeder error:", err);
    process.exit(1);
  }
};

seedAuth();
