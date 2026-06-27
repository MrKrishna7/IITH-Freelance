import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Web Dev",
        "Design",
        "ML",
        "Sketch",
        "Video Editing",
        "Game Dev",
        "Other",
      ],
      required: true,
    },
    tags: [String],
    images: [String],
    price: {
      type: Number,
      default: 0,
    },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);
const Job = mongoose.model("Job", jobSchema);
export default Job;
