import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    credentials: true
}))

//ab alag alag origin se data aa rha toh alag format ho skti

// suppose hum json data accept kr rhe toh kitna kar rhe
app.use(express.json({ limit:"16kb" }))

//url data
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.use(express.static("public"))   //kuch aur images ya pdf ya kuch aaya jo hum store krna chahte ... toh static in public folder

//user ke browser ki cookies access aur set kr paaye 
app.use(cookieParser())  

//Routes import
import userRouter from "./routes/user.routes.js"

//router activation  
app.use("/api/v1/users", userRouter)

// ye /users will go to /users/register


import videoRouter from "./routes/video.routes.js";
app.use("/api/v1/videos", videoRouter);

import subscriptionRouter from "./routes/subscription.routes.js";
app.use("/api/v1/subscriptions", subscriptionRouter);

import likeRouter from "./routes/like.routes.js";
app.use("/api/v1/likes", likeRouter);

import commentRouter from "./routes/comment.routes.js";
app.use("/api/v1/comments", commentRouter);

import tweetRouter from "./routes/tweet.routes.js";
app.use("/api/v1/tweets", tweetRouter);

export { app }