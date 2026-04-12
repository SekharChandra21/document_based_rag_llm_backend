import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema({
  trial_id: String,
  document_type: String,
  section: String,
  text: String,
  embedding: [Number], // vector
});

export default mongoose.model("Embedding", embeddingSchema, "trails_embeddings");