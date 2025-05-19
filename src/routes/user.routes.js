// jitne bhi user related routes honge wo yaha store honge

import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)

export default router