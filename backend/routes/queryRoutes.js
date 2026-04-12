import express from "express";
import { queryRAG } from "../controllers/queryController.js";

const router = express.Router();

router.post("/query", queryRAG);

export default router;