import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import applicationRoleRoutes from "./routes/applicationRole.routes.js";
import applicationUsersRoutes from "./routes/applicationUsers.routes.js";
import requestRoutes from "./routes/request.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import usersRoutes from "./routes/users.routes.js";
import passport from "./config/passport.config.js";
import googleAuthRouter from "./routes/auth.google.route.js";
import cookieParser from "cookie-parser"; 

dotenv.config();

// karena ESM, __dirname harus di-generate manual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://devuar.triasmitra.com",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("API is alive");
});
app.use("/auth", googleAuthRouter); // tambah ini
app.use("/api/auth", googleAuthRouter);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/application-users", applicationUsersRoutes);
app.use("/api", applicationRoleRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", usersRoutes);

app.get("/api/download/manual-book", (req, res) => {
  const filePath = path.join(__dirname, "..", "public", "files", "Manual_Book_Portal.pdf");
  
  console.log("Mencari file di:", filePath);
  console.log("__dirname saat ini:", __dirname);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File tidak ditemukan" });
  }

  res.download(filePath, "Manual_Book_Portal.pdf", (err) => {
    if (err) {
      console.error("Gagal download:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Gagal mengunduh file" });
      }
    }
  });
});


export default app;
