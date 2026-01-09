import dotenv from "dotenv";
import { db } from "./src/config/db.js";

dotenv.config();

const seedApplicationRoles = async () => {
  try {
    /* ================= CREATE TABLE ================= */
    await db.query(`
      CREATE TABLE IF NOT EXISTS application_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        UNIQUE KEY uniq_app_role (application_id, name),
        CONSTRAINT fk_app_roles_application
          FOREIGN KEY (application_id)
          REFERENCES applications(id)
          ON DELETE CASCADE
      )
    `);

    /* ================= GET APPLICATIONS ================= */
    const [applications] = await db.query(
      "SELECT id, code FROM applications WHERE deleted_at IS NULL"
    );

    if (applications.length === 0) {
      console.log("⚠️ Tidak ada application, seeder application_roles dilewati");
      process.exit();
    }

    /* ================= ROLE TEMPLATE ================= */
    const roleTemplates = [
      {
        name: "Viewer",
        description: "Read only access",
      },
      {
        name: "Editor",
        description: "Create and update data",
      },
      {
        name: "Approver",
        description: "Approve workflow requests",
      },
      {
        name: "Admin",
        description: "Full access in application",
      },
    ];

    /* ================= INSERT DATA ================= */
    for (const app of applications) {
      for (const role of roleTemplates) {
        await db.query(
          `
          INSERT INTO application_roles
            (application_id, name, description)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            deleted_at = NULL
          `,
          [app.id, role.name, role.description]
        );
      }
    }

    console.log("Seeder application_roles selesai");
    process.exit();
  } catch (err) {
    console.error("SEED APPLICATION ROLES ERROR:", err);
    process.exit(1);
  }
};

seedApplicationRoles();
