import { Router } from 'express';
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikesCount,
    getCommentLikesCount,
    getTweetLikesCount
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/likecount/v/:videoId").get(getVideoLikesCount);
router.route("/likecount/c/:commentId").get(getCommentLikesCount);
router.route("/likecount/t/:tweetId").get(getTweetLikesCount);


export default router