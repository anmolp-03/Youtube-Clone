import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    let action = "";

    if (existingLike) {
        // User already liked → remove like (toggle off)
        await Like.findByIdAndDelete(existingLike._id);
        action = "unliked";
    } else {
        // User hasn't liked yet → create like (toggle on)
        const likedDoc = await Like.create({
            video: videoId,
            likedBy: userId,
        });

        if(!likedDoc) {
            throw new ApiError(500, "Failed to like the video");
        }

        action = "liked";
    }

    return res.status(200).json(new ApiResponse(200, {videoId}, `Successfully ${action} video`));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId = req.user._id;

    try {
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID");
        }
    
        // Optional: Check if comment exists
        const commentExists = await Comment.exists({ _id: commentId });
        if (!commentExists) {
            throw new ApiError(404, "Comment not found");
        }
    
        // Check if user already liked the comment
        const existingLike = await Like.findOne({
            comment: commentId,
            likedBy: userId,
        });
    
        let action = "";
        if (existingLike) {
            // Already liked → unlike
            await Like.findByIdAndDelete(existingLike._id);
            action = "unliked";
        } else {
            // Not liked → like
            const likedDoc = await Like.create({
                video: videoId,
                likedBy: userId,
                comment: commentId,
                tweet: null, 
            });
    
            if(!likedDoc) {
                throw new ApiError(500, "Failed to like the video");
            }
    
            action = "liked";
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, { commentId, action }, `Successfully ${action} the comment`));
    
    } catch (error) {
        console.error("Error toggling comment like:", error);
        throw new ApiError(500, "Failed to toggle comment like");
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    try {
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet ID");
        }
    
        const tweetExists = await Tweet.exists({ _id: tweetId });
        if (!tweetExists) {
            throw new ApiError(404, "Tweet not found");
        }
    
        const existingLike = await Like.findOne({
            tweet: tweetId,
            likedBy: userId,
        });
    
        let action = "";
        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            action = "unliked";
        } else {
            const likedDoc = await Like.create({
                tweet: tweetId,
                likedBy: userId,
                video: null,
                comment: null,
            });
    
            if (!likedDoc) {
                throw new ApiError(500, "Failed to like the tweet");
            }
            action = "liked";
        }
    
        return res.status(200).json(
            new ApiResponse(200, { tweetId, action }, `Successfully ${action} the tweet`)
        );
    } catch (error) {
        console.error("Error toggling tweet like:", error);
        throw new ApiError(500, "Failed to toggle tweet like");
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    try {
        const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } })
            .populate({
                path: 'video',
                match: { isPublished: true }, // Populate the `video` field with the video details
                select: '_id videoFile thumbnail title description duration views createdAt', // Select the video fields you want
                populate: {
                    path: 'owner', // Assuming the video schema has an `uploadedBy` field for the user
                    select: 'username avatar', // Select user fields like `username` and `avatar`
                }
            })
            .lean()
            .select("-comment -tweet");
    
        console.log(JSON.stringify(likedVD, null, 2)); 
    
        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching liked videos:", error);
        throw new ApiError(500, "Failed to fetch liked videos");
    }
})

const getVideoLikesCount = asyncHandler(async (req, res) => {
    //TODO: get likes count for a video
    const { videoId } = req.params;

    try {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const count = await Like.countDocuments({ video: videoId });

        return res.status(200).json(
            new ApiResponse(200, { videoId, likes: count }, "Video likes count fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching video likes count:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching video likes count"));
    }
});

const getCommentLikesCount = asyncHandler(async (req, res) => {
    //TODO: get likes count for a video
    const { videoId } = req.params;
    const { commentId } = req.params;

    try {
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID");
        }

        const count = await Like.countDocuments({ comment: commentId });

        return res.status(200).json(
            new ApiResponse(200, { commentId, likes: count }, "Comment likes count fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching comment likes count:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching comment likes count"));
    }
});

const getTweetLikesCount = asyncHandler(async (req, res) => {
    //TODO: get likes count for a video
    const { tweetId } = req.params;

    try {
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet ID");
        }

        const count = await Like.countDocuments({ tweet: tweetId });

        return res.status(200).json(
            new ApiResponse(200, { tweetId, likes: count }, "Tweet likes count fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching tweet likes count:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching tweet likes count"));
    }
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikesCount,
    getCommentLikesCount,
    getTweetLikesCount
}