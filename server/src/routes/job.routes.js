import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  getMyJobs,
  updateJob,
} from "../controllers/job.controller.js";
import {
  acceptBid,
  getBidsForJob,
  placeBid,
} from "../controllers/bid.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const jobRouter = Router();

jobRouter
  .route("/")
  .get(getJobs)
  .post(verifyJWT, upload.array("images", 5), createJob);
jobRouter.route("/my").get(verifyJWT, getMyJobs);
jobRouter
  .route("/:id")
  .get(getJobById)
  .patch(verifyJWT, upload.array("images", 5), updateJob)
  .delete(verifyJWT, deleteJob);

jobRouter
  .route("/:id/bids")
  .post(verifyJWT, placeBid)
  .get(verifyJWT, getBidsForJob);
jobRouter.route("/:id/bids/:bidId/accept").patch(verifyJWT, acceptBid);

export { jobRouter };
