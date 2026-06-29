import { Router } from "express";
import {
  acceptBid,
  getBidsForJob,
  getMyBids,
  placeBid,
} from "../controllers/bid.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const bidRouter = Router();

bidRouter.route("/my").get(verifyJWT, getMyBids);
bidRouter
  .route("/job/:id")
  .post(verifyJWT, placeBid)
  .get(verifyJWT, getBidsForJob);
bidRouter.route("/job/:id/:bidId/accept").patch(verifyJWT, acceptBid);

export { bidRouter };
