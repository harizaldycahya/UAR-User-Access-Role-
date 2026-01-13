import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import applicationRoleRoutes from "./routes/applicationRole.routes.js";
import applicationUsersRoutes from "./routes/applicationUsers.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is alive");
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/application-users", applicationUsersRoutes);
app.use("/api", applicationRoleRoutes);

export default app;
