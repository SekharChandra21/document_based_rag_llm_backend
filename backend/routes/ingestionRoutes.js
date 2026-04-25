import express from "express";
import { ingestDocument } from "../controllers/ingestionController.js";
import { verifyN8N } from "../middleware/auth.js";

const router = express.Router();

router.post("/ingest", verifyN8N, ingestDocument);

export default router;
