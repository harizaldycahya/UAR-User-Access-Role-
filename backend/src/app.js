import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import applicationRoleRoutes from "./routes/applicationRole.routes.js";
import applicationUsersRoutes from "./routes/applicationUsers.routes.js";
import requestRoutes from "./routes/request.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import usersRoutes from "./routes/users.routes.js";
import passport from "./config/passport.config.js";
import googleAuthRouter from "./routes/auth.google.route.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://devuar.triasmitra.com",
  ],
  credentials: true,
}));

app.use(express.json());
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

// TEST SEMENTARA — hapus setelah selesai debug
app.get("/test-hr", async (req, res) => {
  try {
    const axios = (await import("axios")).default;
    const result = await axios.get(
      "https://personasys.triasmitra.com/api/auth/get-profile-uar",
      { params: { nik: "KT-23071336" }, timeout: 10000 }
    );
    res.json(result.data);
  } catch (err) {
    res.json({ error: err.message, code: err.code });
  }
});

export default app;
