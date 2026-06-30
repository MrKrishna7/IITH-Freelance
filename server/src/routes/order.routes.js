import express from "express";
import {
  getOrders,
  getOrderById,
  setCheckpoint1,
  cancelOrder,
} from "../controllers/order.controller.js";
import {
  submitCheckpoint,
  approveCheckpoint,
  rejectCheckpoint,
} from "../controllers/checkpoint.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getOrders);
router.get("/:id", verifyJWT, getOrderById);

router.put("/:id/checkpoint1", verifyJWT, setCheckpoint1);
router.put("/:id/cancel", verifyJWT, cancelOrder);

router.put(
  "/:orderId/checkpoints/:number/submit",
  verifyJWT,
  upload.array("files", 5),
  submitCheckpoint,
);
router.put(
  "/:orderId/checkpoints/:number/approve",
  verifyJWT,
  approveCheckpoint,
);
router.put("/:orderId/checkpoints/:number/reject", verifyJWT, rejectCheckpoint);

export default router;
