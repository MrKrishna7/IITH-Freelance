import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(upload.single("avatar"), registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/getme").get(verifyJWT, getCurrentUser);
userRouter.route("/profile").put(verifyJWT, updateUserProfile);
userRouter.route("/:id").get(getUserProfile);

export { userRouter };
