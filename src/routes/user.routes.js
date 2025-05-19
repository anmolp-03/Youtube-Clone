// jitne bhi user related routes honge wo yaha store honge

import { Router } from "express";
import { registerUser,loginUser,logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
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

export default router