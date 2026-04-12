import fs from "fs";
import { extractTextFromPDF } from "../utils/extractText.js";
import { chunkText } from "../utils/chunkText.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import getSupabaseClient from "../config/supabaseClient.js";
import Embedding from "../models/Embedding.js";

const downloadSupabaseFile = async (fileUrl) => {
  const url = new URL(fileUrl);
  const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (!match) {
    throw new Error("Unsupported Supabase storage URL format");
  }

  const bucket = match[1];
  const objectPath = decodeURIComponent(match[2]);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) {
    throw new Error(`Supabase download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const ingestDocumentFromSource = async ({ filePath, trial_id, document_type }) => {
  console.log("🔄 Processing ingest from source:");
  console.log("   filePath:", filePath);
  console.log("   trial_id:", trial_id);
  console.log("   document_type:", document_type);

  if (!filePath) {
    throw new Error("No PDF source provided. filePath is required.");
  }

  let source = filePath;

  if (typeof source === "string" && /^https?:\/\//i.test(source)) {
    console.log("📥 Downloading from Supabase...");
    source = await downloadSupabaseFile(source);
    console.log("✅ Downloaded PDF buffer");
  }

  const text = await extractTextFromPDF(source);
  console.log("🔎 Extracted Text:", text.substring(0, 1000));
  const chunks = chunkText(text, 150);
  const docs = [];

  console.log(`📄 PDF extracted. Chunking text into ${chunks.length} segments...`);

  for (let chunk of chunks) {
    if (chunk.trim().length < 20) continue;

    const embedding = await generateEmbedding(chunk);

    docs.push({
      trial_id,
      document_type,
      section: "general",
      text: chunk,
      embedding,
    });
  }

  console.log(`✅ Created ${docs.length} document embeddings`);

  if (docs.length > 0) {
    await Embedding.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} documents into MongoDB`);
  } else {
    throw new Error("No valid chunks extracted from PDF");
  }
};

export const ingestDocument = async (req, res) => {
  try {
    console.log("📥 Ingest request received:");
    console.log("   Body:", JSON.stringify(req.body, null, 2));
    console.log("   Headers:", req.headers);
    
    await ingestDocumentFromSource(req.body);
    res.json({ message: "Ingestion completed" });
  } catch (err) {
    console.error("❌ Ingestion error:", err);
    const status = err.message?.startsWith("No PDF source provided") ? 400 : 500;
    res.status(status).json({ error: err.message || "Ingestion failed" });
  }
};