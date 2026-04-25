import fs from "fs";
import path from "path";
import stream from "stream";
import csv from "csv-parser";
import XLSX from "xlsx";
import Tesseract from "tesseract.js";

import { extractTextFromPDF } from "../utils/extractText.js";
import { chunkText } from "../utils/chunkText.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import getSupabaseClient from "../config/supabaseClient.js";
import Embedding from "../models/Embedding.js";


// 🔽 Download file from Supabase
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


// 🔽 Parse CSV (buffer)
const parseCSVBuffer = (buffer) => {
  return new Promise((resolve) => {
    const results = [];

    const readable = new stream.Readable();
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results));
  });
};


// 🔽 Convert structured data → text
const convertToText = (rows) => {
  return rows
    .map((row) =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    )
    .join("\n");
};


// 🚀 MAIN INGEST LOGIC
export const ingestDocumentFromSource = async ({ filePath, trial_id, document_type, userId }) => {
  console.log("🔄 Processing ingest from source:");
  console.log("   filePath:", filePath);
  console.log("   trial_id:", trial_id);
  console.log("   document_type:", document_type);
  console.log("   userId:", userId);

  if (!filePath) {
    throw new Error("No file source provided. filePath is required.");
  }

  let source = filePath;

  // 🔽 Download file if URL
  if (typeof source === "string" && /^https?:\/\//i.test(source)) {
    console.log("📥 Downloading file from Supabase...");
    source = await downloadSupabaseFile(source);
    console.log("✅ File downloaded as buffer");
  }

  // 🔽 Detect file type
  const ext = typeof filePath === "string"
    ? path.extname(filePath).toLowerCase()
    : ".pdf";

  console.log("📂 Detected file type:", ext);

  let text = "";

  // 🟢 PDF
  if (ext === ".pdf") {
    text = await extractTextFromPDF(source);
  }

  // 🟢 CSV
  else if (ext === ".csv") {
    const rows = await parseCSVBuffer(source);
    text = convertToText(rows);
  }

  // 🟢 XLSX
  else if (ext === ".xlsx") {
    const workbook = XLSX.read(source, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    text = convertToText(rows);
  }

  // 🟢 IMAGE (JPG / PNG / JPEG)
  else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    console.log("🖼️ Running OCR on image...");

    const result = await Tesseract.recognize(source, "eng", {
      logger: m => console.log("OCR:", m.status)
    });

    text = result.data.text;
  }

  // ❌ Unsupported
  else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  // 🔽 Validate extracted text
  if (!text || text.trim().length === 0) {
    throw new Error("No text could be extracted from the file");
  }

  console.log("🔎 Extracted Text Preview:", text.slice(0, 500));

  // 🔽 Chunking
  const chunks = chunkText(text, 150);
  console.log(`📄 Chunking into ${chunks.length} segments...`);

  const docs = [];

  // 🔽 Generate embeddings
  for (let chunk of chunks) {
    if (chunk.trim().length < 20) continue;

    const embedding = await generateEmbedding(chunk);

    docs.push({
      userId,
      trial_id,
      document_type,
      section: "general",
      text: chunk,
      embedding,
    });
  }

  console.log(`✅ Created ${docs.length} embeddings`);

  if (docs.length > 0) {
    await Embedding.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} documents into MongoDB`);
  } else {
    throw new Error("No valid chunks extracted");
  }
};

// 🚀 API CONTROLLER
export const ingestDocument = async (req, res) => {
  try {
    console.log("📥 Ingest request received:");
    console.log("   Body:", JSON.stringify(req.body, null, 2));

    const userId = req.body.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.body.userId && req.user?.role !== "admin" && req.body.userId !== req.user?.id) {
      return res.status(403).json({ error: "User ID does not match authenticated user" });
    }

    await ingestDocumentFromSource({
      ...req.body,
      userId
    });

    res.json({ message: "Ingestion completed successfully" });

  } catch (err) {
    console.error("❌ Ingestion error:", err);

    const status = err.message?.includes("No file source") ? 400 : 500;

    res.status(status).json({
      error: err.message || "Ingestion failed"
    });
  }
};