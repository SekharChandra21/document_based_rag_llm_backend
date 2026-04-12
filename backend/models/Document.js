import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  trial_id: String,
  document_type: String,
  version: String,
  file_path: String,
  uploaded_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Document", documentSchema, "trails_metadata");