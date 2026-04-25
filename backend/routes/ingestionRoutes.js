import express from "express";
import { ingestDocument } from "../controllers/ingestionController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/ingest", authMiddleware, ingestDocument);

export default router;