import mongoose from "mongoose";

const checkpointSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    number: { type: Number, enum: [1, 2], required: true },
    description: { type: String }, // only set for checkpoint 1, by buyer
    dueDate: { type: Date }, // only set for checkpoint 1, checkpoint 2 uses job deadline
    status: {
      type: String,
      enum: ["pending", "submitted", "approved", "rejected"],
      default: "pending",
    },
    submissionNote: { type: String },
    submissionFiles: [String],
  },
  { timestamps: true },
);

export default mongoose.model("Checkpoint", checkpointSchema);
