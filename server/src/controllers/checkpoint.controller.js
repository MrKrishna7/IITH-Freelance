import Checkpoint from "../models/checkpoint.model.js";
import Order from "../models/order.model.js";
import Job from "../models/job.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { onCloudinary } from "../utils/cloudinary.js";

const uploadFilesToCloudinary = async (files = []) => {
  const uploadedFiles = [];

  for (const file of files) {
    const uploaded = await onCloudinary(file.path);
    if (!uploaded?.url) {
      throw new ApiError(500, "Failed to upload submission file");
    }
    uploadedFiles.push(uploaded.url);
  }

  return uploadedFiles;
};

export const submitCheckpoint = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.seller.toString() !== req.user.id)
    throw new ApiError(403, "Only seller can submit work");

  const number = Number(req.params.number);
  const cp = await Checkpoint.findOne({ order: order._id, number });
  if (!cp) throw new ApiError(404, "Checkpoint not found");
  if (cp.status !== "pending")
    throw new ApiError(400, "Checkpoint cannot be submitted at this stage");

  if (number === 1 && !cp.description)
    throw new ApiError(400, "Buyer has not set checkpoint 1 details yet");

  if (number === 2) {
    const cp1 = await Checkpoint.findOne({ order: order._id, number: 1 });
    if (cp1.status !== "approved")
      throw new ApiError(
        400,
        "Checkpoint 1 must be approved before submitting checkpoint 2",
      );
  }

  const files = await uploadFilesToCloudinary(req.files);
  cp.status = "submitted";
  cp.submissionNote = req.body.note || "";
  cp.submissionFiles = files;
  await cp.save();

  return res.status(200).json(new ApiResponse(200, "Checkpoint submitted", cp));
});

export const approveCheckpoint = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.buyer.toString() !== req.user.id)
    throw new ApiError(403, "Only buyer can approve");

  const number = Number(req.params.number);
  const cp = await Checkpoint.findOne({ order: order._id, number });
  if (!cp) throw new ApiError(404, "Checkpoint not found");
  if (cp.status !== "submitted")
    throw new ApiError(400, "Checkpoint has not been submitted yet");

  cp.status = "approved";
  await cp.save();

  if (number === 2) {
    await Job.findByIdAndUpdate(order.job, { status: "completed" });
    return res
      .status(200)
      .json(new ApiResponse(200, "Work completed, you can now leave a review"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Checkpoint 1 approved, seller can now submit final work",
      ),
    );
});

export const rejectCheckpoint = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.buyer.toString() !== req.user.id)
    throw new ApiError(403, "Only buyer can reject");

  const number = Number(req.params.number);
  const cp = await Checkpoint.findOne({ order: order._id, number });
  if (!cp) throw new ApiError(404, "Checkpoint not found");
  if (cp.status !== "submitted")
    throw new ApiError(400, "Checkpoint has not been submitted yet");

  await Checkpoint.deleteMany({ order: order._id });
  await Order.findByIdAndDelete(order._id);
  await Job.findByIdAndUpdate(order.job, {
    status: "pending",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Checkpoint rejected, order cancelled, job reopened",
      ),
    );
});
