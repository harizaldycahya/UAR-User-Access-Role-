import dotenv from "dotenv";
import { db } from "./src/config/db.js";

dotenv.config();

const ICON_SVG =
  "<svg viewBox='0 0 24 24' fill='currentColor'><path d='M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z'/></svg>";

const seedApplications = async () => {
  const apps = [
    {
      code: "HRIS",
      name: "Human Resource Information System",
      url: "https://hris.example.com",
    },
    {
      code: "FIN",
      name: "Finance System",
      url: "https://finance.example.com",
    },
    {
      code: "CRM",
      name: "Customer Relationship Management",
      url: "https://crm.example.com",
    },
    {
      code: "INV",
      name: "Inventory Management",
      url: "https://inventory.example.com",
    },
    {
      code: "OPS",
      name: "Operational System",
      url: "https://ops.example.com",
    },
    {
      code: "DMS",
      name: "Document Management System",
      url: "https://dms.example.com",
    },
    {
      code: "PMT",
      name: "Project Management Tool",
      url: "https://pmt.example.com",
    },
    {
      code: "QMS",
      name: "Quality Management System",
      url: "https://qms.example.com",
    },
    {
      code: "LMS",
      name: "Learning Management System",
      url: "https://lms.example.com",
    },
    {
      code: "SUP",
      name: "Support Ticket System",
      url: "https://support.example.com",
    },
  ];

  const owners = ["KT-23071336", "KT-23080001", "KT-23090012"];
  const colors = ["#16A34A", "#2563EB", "#DC2626", "#7C3AED", "#F59E0B"];

  for (const app of apps) {
    await db.query(
      `INSERT INTO applications 
      (is_accessible, owner, code, name, url, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Math.random() > 0.3,
        owners[Math.floor(Math.random() * owners.length)],
        app.code,
        app.name,
        app.url,
        colors[Math.floor(Math.random() * colors.length)],
        ICON_SVG,
      ]
    );
  }

  console.log("Seeder applications 10 data selesai");
  process.exit();
};

seedApplications();
