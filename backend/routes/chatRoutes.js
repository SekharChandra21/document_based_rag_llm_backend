import express from "express";
import {
  createChat,
  getChats,
  getChatById,
  updateChatTitle,
  deleteChat,
  deleteChatAdmin
} from "../controllers/chatController.js";
import { authMiddleware, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createChat);
router.get("/", authMiddleware, getChats);
router.get("/admin/all", authMiddleware, authorizeRoles("admin"), getChats);
router.delete("/admin/:id", authMiddleware, authorizeRoles("admin"), deleteChatAdmin);
router.get("/:id", authMiddleware, getChatById);
router.put("/:id", authMiddleware, updateChatTitle);
router.delete("/:id", authMiddleware, deleteChat);

export default router;