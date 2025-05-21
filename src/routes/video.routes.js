import { Routes } from 'express';
import { 
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Routes();

router.use(verifyJWT)       // applies midddleware for all routes below

router.route('/')
.get(getAllVideos) // get all videos


