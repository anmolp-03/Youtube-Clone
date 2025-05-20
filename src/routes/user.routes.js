// jitne bhi user related routes honge wo yaha store honge

import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateProfileDetails, 
    updateAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
} from "../controllers/user.controller.js";

import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

// 'upload' middleware hai, tabhi registeruser ke pehle
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes with middlewares
router.route("/logout").post(verifyJWT, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

// only a part is to be updated , so 'patch'
router.route("/update-account").patch(verifyJWT, updateProfileDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router