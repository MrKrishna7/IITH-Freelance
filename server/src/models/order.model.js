import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
