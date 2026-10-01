import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: { type: String, required: true },
    extractedText: { type: String, required: true },
    jobDescription: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "analyzed", "failed"],
      default: "pending",
    },
    atsScore: { type: Number, default: null },
    analysis: { type: Object, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("Resume", resumeSchema);
