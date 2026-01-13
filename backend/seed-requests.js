import dotenv from "dotenv";
import { db } from "./src/config/db.js";

dotenv.config();

/* =======================
   CONSTANTS
======================= */

const REQUEST_TYPES = {
  APP_ACCESS: "application_access",
  ROLE_CHANGE: "role_change",
};

const ROLES = {
  USER: "user",
  MANAGER: "manager",
  KADIV: "kadiv",
  HR: "hr",
  BO: "business_owner",
};

/* =======================
   CREATE TABLES
======================= */

const createTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS approval_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_type VARCHAR(50) NOT NULL,
      step_order INT NOT NULL,
      approver_role VARCHAR(50) NOT NULL,
      UNIQUE KEY uniq_template (request_type, step_order)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_type VARCHAR(50) NOT NULL,
      requester_id INT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS request_application_access (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      application_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_req_app (request_id),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS request_role_change (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      from_role VARCHAR(50) NOT NULL,
      to_role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_req_role (request_id),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS request_approval_steps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      step_order INT NOT NULL,
      approver_role VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      approved_at TIMESTAMP NULL,
      UNIQUE KEY uniq_step (request_id, step_order),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ tables created / verified");
};

/* =======================
   APPROVAL TEMPLATES
======================= */

const seedApprovalTemplates = async () => {
  const templates = [
    // Application Access
    { type: REQUEST_TYPES.APP_ACCESS, order: 1, role: ROLES.MANAGER },
    { type: REQUEST_TYPES.APP_ACCESS, order: 2, role: ROLES.KADIV },
    { type: REQUEST_TYPES.APP_ACCESS, order: 3, role: ROLES.HR },
    { type: REQUEST_TYPES.APP_ACCESS, order: 4, role: ROLES.BO },

    // Role Change
    { type: REQUEST_TYPES.ROLE_CHANGE, order: 1, role: ROLES.MANAGER },
    { type: REQUEST_TYPES.ROLE_CHANGE, order: 2, role: ROLES.HR },
    { type: REQUEST_TYPES.ROLE_CHANGE, order: 3, role: ROLES.BO },
  ];

  for (const t of templates) {
    await db.query(
      `
      INSERT IGNORE INTO approval_templates
      (request_type, step_order, approver_role)
      VALUES (?, ?, ?)
      `,
      [t.type, t.order, t.role]
    );
  }

  console.log("✅ approval_templates seeded");
};

/* =======================
   REQUESTS
======================= */

const seedRequests = async () => {
  // ambil application id (assume ada)
  const [[app]] = await db.query(`SELECT id FROM applications LIMIT 1`);

  /* ===== Application Access Request ===== */

  const [appReq] = await db.query(
    `
    INSERT INTO requests (request_type, requester_id, status)
    VALUES (?, ?, 'pending')
    `,
    [REQUEST_TYPES.APP_ACCESS, 1]
  );

  const appRequestId = appReq.insertId;

  await db.query(
    `
    INSERT INTO request_application_access
    (request_id, application_id)
    VALUES (?, ?)
    `,
    [appRequestId, app.id]
  );

  const [appSteps] = await db.query(
    `
    SELECT step_order, approver_role
    FROM approval_templates
    WHERE request_type = ?
    ORDER BY step_order
    `,
    [REQUEST_TYPES.APP_ACCESS]
  );

  for (const step of appSteps) {
    await db.query(
      `
      INSERT INTO request_approval_steps
      (request_id, step_order, approver_role, status)
      VALUES (?, ?, ?, 'pending')
      `,
      [appRequestId, step.step_order, step.approver_role]
    );
  }

  console.log("✅ application access request seeded");

  /* ===== Role Change Request ===== */

  const [roleReq] = await db.query(
    `
    INSERT INTO requests (request_type, requester_id, status)
    VALUES (?, ?, 'pending')
    `,
    [REQUEST_TYPES.ROLE_CHANGE, 1]
  );

  const roleRequestId = roleReq.insertId;

  await db.query(
    `
    INSERT INTO request_role_change
    (request_id, from_role, to_role)
    VALUES (?, ?, ?)
    `,
    [roleRequestId, ROLES.USER, ROLES.MANAGER]
  );

  const [roleSteps] = await db.query(
    `
    SELECT step_order, approver_role
    FROM approval_templates
    WHERE request_type = ?
    ORDER BY step_order
    `,
    [REQUEST_TYPES.ROLE_CHANGE]
  );

  for (const step of roleSteps) {
    await db.query(
      `
      INSERT INTO request_approval_steps
      (request_id, step_order, approver_role, status)
      VALUES (?, ?, ?, 'pending')
      `,
      [roleRequestId, step.step_order, step.approver_role]
    );
  }

  console.log("✅ role change request seeded");
};

/* =======================
   RUN ALL
======================= */

const runSeeder = async () => {
  try {
    await createTables();
    await seedApprovalTemplates();
    await seedRequests();

    console.log("🎉 ALL SEEDERS DONE");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  }
};

runSeeder();
