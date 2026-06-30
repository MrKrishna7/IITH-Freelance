import Order from "../models/order.model.js";
import Checkpoint from "../models/checkpoint.model.js";
import Job from "../models/job.model.js";
import Bid from "../models/bid.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createOrderFromBid = async (job, bid) => {
  const order = await Order.create({
    job: job._id,
    buyer: job.postedBy,
    seller: bid.bidder,
    bid: bid._id,
  });

  await Checkpoint.create([
    { order: order._id, number: 1, status: "pending" },
    { order: order._id, number: 2, status: "pending" },
  ]);

  return order;
};

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    $or: [{ buyer: req.user.id }, { seller: req.user.id }],
  })
    .populate("job", "title deadline status")
    .populate("buyer", "fullName avatar")
    .populate("seller", "fullName avatar")
    .populate("bid", "bidAmount deliveryDays");

  return res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("job", "title deadline status")
    .populate("buyer", "fullName avatar")
    .populate("seller", "fullName avatar")
    .populate("bid", "bidAmount deliveryDays proposal");

  if (!order) throw new ApiError(404, "Order not found");

  const isBuyer = order.buyer._id.toString() === req.user.id;
  const isSeller = order.seller._id.toString() === req.user.id;
  if (!isBuyer && !isSeller) throw new ApiError(403, "Not your order");

  const checkpoints = await Checkpoint.find({ order: order._id }).sort(
    "number",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Order fetched", { order, checkpoints }));
});

export const setCheckpoint1 = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.buyer.toString() !== req.user.id)
    throw new ApiError(403, "Only buyer can set checkpoint details");

  const { description, dueDate } = req.body;
  if (!description || !dueDate)
    throw new ApiError(400, "Description and due date are required");

  const cp1 = await Checkpoint.findOne({ order: order._id, number: 1 });
  if (cp1.description) throw new ApiError(400, "Checkpoint 1 already set");

  cp1.description = description;
  cp1.dueDate = dueDate;
  await cp1.save();

  return res.status(200).json(new ApiResponse(200, "Checkpoint 1 set", cp1));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.seller.toString() !== req.user.id)
    throw new ApiError(403, "Only seller can cancel");

  const cp1 = await Checkpoint.findOne({ order: order._id, number: 1 });
  if (cp1.status !== "pending")
    throw new ApiError(400, "Cannot cancel after submitting work");

  await Checkpoint.deleteMany({ order: order._id });
  await Order.findByIdAndDelete(order._id);
  await Job.findByIdAndUpdate(order.job, {
    status: "pending",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Order cancelled, job reopened for bidding"));
});
