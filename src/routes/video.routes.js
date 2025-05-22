import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  addView,
} from "../controllers/video.controller.js";

import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Apply auth middleware to all routes
router.use(verifyJWT);

// /videos/
router.route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
  );

// /videos/:id
router.route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

// /videos/:id/toggle
router.patch("/:videoId/toggle", togglePublishStatus);

// /videos/:id/view
router.patch("/:videoId/view", addView);

export default router;
