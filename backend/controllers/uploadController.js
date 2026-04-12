import axios from "axios";
import getSupabaseClient from "../config/supabaseClient.js";
import Document from "../models/Document.js";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { trial_id, document_type, version } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const supabase = getSupabaseClient();
    const fileName = `${Date.now()}_${file.originalname}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
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

    // Save metadata to MongoDB
    const doc = await Document.create({
      trial_id,
      document_type,
      version,
      file_path: fileUrl,
    });

    console.log(`📄 Document metadata saved:`, doc._id);

    // Trigger ingestion (don't await - let it run async)
    axios.post("https://pushpaallu.app.n8n.cloud/webhook/ingest-doc", {
      filePath: fileUrl,
      trial_id,
      document_type,
    }).catch(err => {
      console.error("⚠️  N8N webhook error (async):", err.message);
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
