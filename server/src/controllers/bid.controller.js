import mongoose from "mongoose";
import Bid from "../models/bid.model.js";
import Job from "../models/job.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrderFromBid } from "./order.controller.js";

const getPositive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const placeBid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { proposal, bidAmount, deliveryDays } = req.body;
  const userId = req.user?._id;

  if (!proposal?.trim()) {
    throw new ApiError(400, "Proposal is required");
  }

  const amount = getPositive(bidAmount);
  if (!amount) {
    throw new ApiError(400, "Valid bid amount is required");
  }

  const days = getPositive(deliveryDays);
  if (!days) {
    throw new ApiError(400, "Valid delivery days is required");
  }
  if (!id) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.status !== "pending") {
    throw new ApiError(400, "Job is no longer accepting bids");
  }

  if (job.postedBy.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot bid on your own job");
  }

  const existingBid = await Bid.findOne({
    job: job._id,
    bidder: userId,
  });

  if (existingBid) {
    throw new ApiError(400, "You have already bid on this job");
  }

  const bid = await Bid.create({
    job: job._id,
    bidder: userId,
    proposal: proposal.trim(),
    bidAmount: amount,
    deliveryDays: days,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Bid placed successfully", bid));
});

const getBidsForJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!id) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the job owner can view bids");
  }

  const bids = await Bid.find({ job: job._id })
    .populate("bidder", "username fullName avatar rating")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Bids fetched successfully", bids));
});

const acceptBid = asyncHandler(async (req, res) => {
  const { id, bidId } = req.params;
  const userId = req.user?._id;

  if (!id || !bidId) {
    throw new ApiError(400, "Invalid job or bid id");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the job owner can accept bids");
  }

  if (job.status !== "pending") {
    throw new ApiError(400, "A bid has already been accepted for this job");
  }

  const bid = await Bid.findOne({ _id: bidId, job: job._id });
  if (!bid) {
    throw new ApiError(404, "Bid not found");
  }

  bid.status = "accepted";
  await bid.save();

  await Bid.updateMany(
    { job: job._id, _id: { $ne: bid._id } },
    { $set: { status: "rejected" } },
  );

  job.status = "in_progress";
  await job.save();
  const order = await createOrderFromBid(job, bid);

  return res
    .status(200)
    .json(new ApiResponse(200, "Bid accepted", { bid, order }));
});

const getMyBids = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const bids = await Bid.find({ bidder: userId })
    .populate("job", "title description category price status deadline")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Your bids fetched successfully", bids));
});

export { acceptBid, getBidsForJob, getMyBids, placeBid };
