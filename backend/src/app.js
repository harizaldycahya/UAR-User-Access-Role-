import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is alive");
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

export default app;
