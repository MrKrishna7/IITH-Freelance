import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Bid from "../models/bid.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { onCloudinary } from "../utils/cloudinary.js";

const getPositive = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadedFiles = [];

  for (const file of files) {
    const uploaded = await onCloudinary(file.path);
    if (!uploaded?.url) {
      throw new ApiError(500, "Failed to upload image");
    }
    uploadedFiles.push(uploaded.url);
  }

  return uploadedFiles;
};

const createJob = asyncHandler(async (req, res) => {
  const { title, description, category, tags, price, deadline } = req.body;
  const userId = req.user?._id;

  if (!title?.trim() || !description?.trim() || !category?.trim()) {
    throw new ApiError(400, "Title, description and category are required");
  }

  if (!deadline || Number.isNaN(Date.parse(deadline))) {
    throw new ApiError(400, "Valid deadline is required");
  }

  const jobPrice = getPositive(price);
  if (price !== undefined && jobPrice === null) {
    throw new ApiError(400, "Valid price is required");
  }

  const images = await uploadFilesToCloudinary(req.files);

  const job = await Job.create({
    postedBy: userId,
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    tags: parseTags(tags),
    images,
    price: jobPrice || 0,
    deadline,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Job created successfully", job));
});

const getJobs = asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, keyword } = req.query;
  const filter = {};

  if (category) filter.category = category;

  const min = getPositive(minPrice);
  const max = getPositive(maxPrice);

  if (min !== null || max !== null) {
    filter.price = {};
    if (min !== null) filter.price.$gte = min;
    if (max !== null) filter.price.$lte = max;
  }

  if (keyword?.trim()) {
    filter.$or = [
      { title: { $regex: keyword.trim(), $options: "i" } },
      { description: { $regex: keyword.trim(), $options: "i" } },
      { tags: { $regex: keyword.trim(), $options: "i" } },
    ];
  }

  const jobs = await Job.find(filter)
    .populate("postedBy", "username fullName avatar rating")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Jobs fetched successfully", jobs));
});

const getMyJobs = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Your jobs fetched successfully", jobs));
});

const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(id).populate(
    "postedBy",
    "username fullName avatar rating",
  );

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Job fetched successfully", job));
});

const updateJob = asyncHandler(async (req, res) => {
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
    throw new ApiError(403, "This is not your job");
  }

  if (job.status !== "pending") {
    throw new ApiError(400, "Only pending jobs can be edited");
  }

  const { title, description, category, tags, price, deadline } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Title cannot be empty");
    job.title = title.trim();
  }

  if (description !== undefined) {
    if (!description.trim())
      throw new ApiError(400, "Description cannot be empty");
    job.description = description.trim();
  }

  if (category !== undefined) {
    if (!category.trim()) throw new ApiError(400, "Category cannot be empty");
    job.category = category.trim();
  }

  if (tags !== undefined) {
    job.tags = parseTags(tags);
  }

  if (price !== undefined) {
    const jobPrice = getPositive(price);
    if (jobPrice === null) throw new ApiError(400, "Valid price is required");
    job.price = jobPrice;
  }

  if (deadline !== undefined) {
    if (Number.isNaN(Date.parse(deadline))) {
      throw new ApiError(400, "Valid deadline is required");
    }
    job.deadline = deadline;
  }

  if (req.files && req.files.length > 0) {
    const newImages = await uploadFilesToCloudinary(req.files);

    if (!job.images) {
      job.images = [];
    }

    job.images = job.images.concat(newImages);
  }
  await job.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Job updated successfully", job));
});

const deleteJob = asyncHandler(async (req, res) => {
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
    throw new ApiError(403, "Not your job");
  }

  if (job.status !== "pending") {
    throw new ApiError(400, "Only pending jobs can be deleted");
  }

  await Bid.deleteMany({ job: job._id });
  await job.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, "Job deleted successfully", {}));
});

export { createJob, deleteJob, getJobById, getJobs, getMyJobs, updateJob };
