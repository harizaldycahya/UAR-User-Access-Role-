import express from "express";
import { versionCheck } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/version-check", versionCheck);

export default router;