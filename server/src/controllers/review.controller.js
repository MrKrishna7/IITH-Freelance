import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import Checkpoint from "../models/checkpoint.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const leaveReview = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate(
    "job",
    "status",
  );

  if (!order) throw new ApiError(404, "Order not found");

  if (order.job.status !== "completed") {
    throw new ApiError(400, "Cannot review before work is completed");
  }

  const isBuyer = order.buyer.toString() === req.user._id.toString();
  const isSeller = order.seller.toString() === req.user._id.toString();
  if (!isBuyer && !isSeller) throw new ApiError(403, "Not your order");

  const revieweeId = isBuyer ? order.seller : order.buyer;

  const { rating, comment } = req.body;
  if (!rating || !comment) {
    throw new ApiError(400, "Rating and comment are required");
  }
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const existingReview = await Review.findOne({
    order: order._id,
    reviewer: req.user._id,
  });

  if (existingReview) {
    throw new ApiError(400, "You already reviewed this order");
  }

  const review = await Review.create({
    order: order._id,
    reviewer: req.user._id,
    reviewee: revieweeId,
    rating,
    comment,
  });

  const allReviews = await Review.find({ reviewee: revieweeId });
  let total = 0;

  for (const review of allReviews) {
    total += review.rating;
  }

  const avgRating = total / allReviews.length;

  await User.findByIdAndUpdate(revieweeId, { rating: avgRating.toFixed(1) });

  const reviewCount = await Review.countDocuments({ order: order._id });
  //Deleting the whole order ,job and checkpoint --Design choice .May change later
  if (reviewCount === 2) {
    await Checkpoint.deleteMany({ order: order._id });
    await Order.findByIdAndDelete(order._id);
    await Job.findByIdAndDelete(order.job._id);
  }

  return res.status(201).json(new ApiResponse(201, "Review submitted", review));
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "Invalid user ID");
  }

  const reviews = await Review.find({ reviewee: userId })
    .populate({
      path: "reviewer",
      select: "fullName avatar username",
    })
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        reviews.length ? "Reviews fetched successfully" : "No reviews found",
        reviews,
      ),
    );
});
