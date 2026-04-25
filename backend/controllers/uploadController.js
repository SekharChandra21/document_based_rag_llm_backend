import axios from "axios";
import path from "path";
import getSupabaseClient from "../config/supabaseClient.js";
import Document from "../models/Document.js";

export const uploadFile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const file = req.file;
    const { trial_id, document_type, version } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Validate file type
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = [".pdf", ".csv", ".xlsx", ".jpg", ".jpeg", ".png"];

    if (!allowedExt.includes(ext)) {
      return res.status(400).json({
        error: "Only PDF, CSV, XLSX, JPG, JPEG, PNG files are allowed"
      });
    }
    
    const supabase = getSupabaseClient();
    const fileName = `${Date.now()}_${file.originalname}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Save metadata
    const doc = await Document.create({
      userId,
      trial_id,
      document_type,
      version,
      file_path: fileUrl,
    });

    console.log(`📄 Document metadata saved:`, doc._id);

    // 🔄 Process ingestion immediately
    try {
      await ingestDocumentFromSource({
        filePath: fileUrl,
        trial_id,
        document_type,
        userId
      });
      console.log("✅ Ingestion completed successfully");
    } catch (ingestError) {
      console.error("❌ Ingestion failed:", ingestError.message);
      // Don't fail the upload, but log the error
    }

    // ✅ Send fileType to n8n (optional, for other processing)
    axios.post(`https://${process.env.N8N_DOMAIN_URL}/webhook/ingest-doc`, {
      filePath: fileUrl,
      trial_id,
      document_type,
      userId,
      fileType: ext
    }).catch(err => {
      console.error("⚠️ N8N webhook error:", err.message);
    });

    res.status(200).json({
      message: "File uploaded successfully",
      document: doc,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const docs = await Document.find({ userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error("Get documents error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};