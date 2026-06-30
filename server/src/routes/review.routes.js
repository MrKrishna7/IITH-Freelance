import express from "express";
import {
  leaveReview,
  getUserReviews,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:orderId", verifyJWT, leaveReview);
router.get("/user/:userId", getUserReviews);

export default router;
