import express from "express";
import { queryRAG } from "../controllers/queryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/query", authMiddleware, queryRAG);

export default router;