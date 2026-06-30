import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { jobRouter } from "./routes/job.routes.js";
import { bidRouter } from "./routes/bid.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import { cleanupUploadedFiles } from "./utils/uploadCleanup.js";
export const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

app.use(express.static("public"));

app.use(cookieParser());

import { userRouter } from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/bids", bidRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(async (err, req, res, next) => {
  await cleanupUploadedFiles(req);

  const statusCode = Number(err.statusCode) || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
    data: null,
  });
});
