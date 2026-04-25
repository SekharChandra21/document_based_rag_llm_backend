import ChatSession from "../models/ChatSession.js";

const buildOwnershipQuery = (req, id) => {
  if (req.user?.role === "admin") {
    return { _id: id };
  }
  return { _id: id, userId: req.user.id };
};

// 🟢 Create new chat
export const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await ChatSession.create({
      userId: req.user.id,
      title: title?.trim() || "New Chat",
      messages: []
    });

    res.json(chat);
  } catch (err) {
    console.error("Create chat error:", err);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

// 🟢 Get chats for current user
export const getChats = async (req, res) => {
  try {
    const query = req.user.role === "admin"
      ? {}
      : { userId: req.user.id };

    let chatsQuery = ChatSession.find(query)
      .sort({ createdAt: -1 })
      .select("_id title createdAt userId");

    if (req.user.role === "admin") {
      chatsQuery = chatsQuery.populate("userId", "email name role");
    }

    const chats = await chatsQuery;

    res.json(chats);
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

// 🟢 Get single chat
export const getChatById = async (req, res) => {
  try {
    const chat = await ChatSession.findOne(buildOwnershipQuery(req, req.params.id));

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Get chat error:", err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
};

// 🟢 Update chat title
export const updateChatTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const chat = await ChatSession.findOneAndUpdate(
      buildOwnershipQuery(req, id),
      { title: title?.trim() || "New Chat" },
      { returnDocument: "after" }
    );

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Update chat error:", err);
    res.status(500).json({ error: "Update failed" });
  }
};

// 🟢 Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const deletedChat = await ChatSession.findOneAndDelete(buildOwnershipQuery(req, req.params.id));

    if (!deletedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};

// 🟢 Admin delete any chat
export const deleteChatAdmin = async (req, res) => {
  try {
    const deletedChat = await ChatSession.findByIdAndDelete(req.params.id);

    if (!deletedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error("Admin delete chat error:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};