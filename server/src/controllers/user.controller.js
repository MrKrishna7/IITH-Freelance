import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { onCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const generateTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(400, "Error creating tokens");
  }
};
export const registerUser = asyncHandler(async (req, res) => {
  let { fullName, emailID, password, username } = req.body;

  fullName = fullName?.trim();
  emailID = emailID?.trim().toLowerCase();
  username = username?.trim().toLowerCase();
  password = password?.trim();

  // validate required fields
  if (!fullName || !emailID || !password || !username) {
    throw new ApiError(400, "All fields are required");
  }

  // validate institute email
  if (!emailID.endsWith("@iith.ac.in")) {
    throw new ApiError(400, "Only @iith.ac.in emails are allowed");
  }

  // check existing user
  const existingUser = await User.findOne({
    $or: [{ username }, { emailID }],
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ApiError(400, "Username already in use");
    }

    if (existingUser.emailID === emailID) {
      throw new ApiError(400, "Email already in use");
    }
  }

  // avatar upload
  let avatarUrl = "";

  if (req.file?.path) {
    const avatar = await onCloudinary(req.file.path);
    avatarUrl = avatar?.url || "";
  }

  // create user
  const user = await User.create({
    fullName,
    username,
    emailID,
    password,
    avatar: avatarUrl,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "User created", createdUser));
});
export const loginUser = asyncHandler(async (req, res) => {
  const { emailID, password } = req.body;

  if (!emailID?.trim() || !password?.trim())
    throw new ApiError(400, "All fields are required");

  const email = emailID.trim().toLowerCase();

  const user = await User.findOne({ emailID: email });

  if (!user) throw new ApiError(404, "User not found");
  if (!(await user.isPassCorrect(password)))
    throw new ApiError(401, "Incorrect password");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Login successful", {
        user: loggedInUser,
      }),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: null },
  });

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "Logged out successfully", {}));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token required");

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );
  const user = await User.findById(decoded?._id);

  if (!user || user.refreshToken !== incomingRefreshToken)
    throw new ApiError(401, "Invalid or expired refresh token");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "Token refreshed", {}));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword?.trim() || !newPassword?.trim())
    throw new ApiError(400, "Both passwords are required");

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  if (!(await user.isPassCorrect(oldPassword)))
    throw new ApiError(401, "Incorrect current password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, "Password updated", {}));
});

export const getCurrentUser = asyncHandler((req, res) => {
  return res.status(200).json(new ApiResponse(200, "Current user", req.user));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "User profile", user));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, bio, skills } = req.body;

  if (fullName !== undefined && !fullName.trim()) {
    throw new ApiError(400, "Full name cannot be empty");
  }

  const update = {};
  if (fullName !== undefined) update.fullName = fullName.trim();
  if (bio !== undefined) update.bio = bio.trim();
  if (skills !== undefined) {
    update.skills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, "Profile updated", user));
});
