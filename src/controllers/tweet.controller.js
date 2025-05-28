import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const userExists = await User.exists({ _id: userId })
    if (!userExists) {
        throw new ApiError(404, "User not found")
    }

    const tweetsAggregate = Tweet.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const tweets = await Tweet.aggregatePaginate(tweetsAggregate, options)

    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    )
})

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    const newTweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!newTweet) {
        throw new ApiError(500, "Failed to create tweet")
    }

    const tweet = await Tweet.aggregate([
        { $match: { _id: newTweet._id } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $addFields: {
                likesCount: { $literal: 0 },
                isLiked: { $literal: false }
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                owner: {
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    return res.status(201).json(
        new ApiResponse(201, tweet[0], "Tweet created successfully")
    )
})


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { $set: { content: content.trim() } },
        { new: true }
    )

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found or unauthorized")
    }

    const result = await Tweet.aggregate([
        { $match: { _id: updatedTweet._id } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, result[0], "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const result = await Tweet.findByIdAndDelete(tweetId)

    if (!result) {
        throw new ApiError(500, "Error while deleting tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
