import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    trial_id: String,
    document_type: String,
    version: String,
    file_path: String
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema, "trails_metadata");