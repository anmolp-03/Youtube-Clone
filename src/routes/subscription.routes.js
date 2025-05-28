import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:channelId")       // channel subcribing to
    .post(toggleSubscription);

router.route("/s/:currId")    // subscriber
    .get(getSubscribedChannels);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router