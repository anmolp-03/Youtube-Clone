import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    try {
        const subscriberId = req.user._id;
        const { channelId } = req.params;

        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid Channel ID");
        }

        if (subscriberId.toString() === channelId) {
            throw new ApiError(400, "You cannot subscribe to your own channel");
        }

        const existingSub = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId,
        });

         let action = "";
            if (existingSub) {
                // Already subscribed → unsubscribe
                await Subscription.findByIdAndDelete(existingSub._id);
                action = "unsubscribed";
            } else {
                // Not subscribed → subscribe
                await Subscription.create({
                    subscriber: subscriberId,
                    channel: channelId,
                });
                action = "subscribed";
            }

            return res
            .status(200)
            .json(new ApiResponse(200, { subscribedTo: channelId }, `Successfully ${action}`))


    } catch (error) {
        throw new ApiError(400, "Error in toggle subscription");
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID");
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Main aggregation pipeline
        const subscribersPipeline = [
            { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
            {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
            },
            { $unwind: "$subscriberDetails" },
            {
            $project: {
                _id: 0,
                username: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar",
                subscribedAt: "$createdAt"
            }
            },
            { $sort: { subscribedAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];

        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        const subscribers = await Subscription.aggregate(subscribersPipeline);

        return res.status(200).json(
            new ApiResponse(200, {
            subscribers,
            totalSubscribers,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalSubscribers / limit)
            }, "Channel subscribers fetched successfully")
        );

    } catch (error) {
        throw new ApiError(400, "Error getting user channel subscriber")
    }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid subscriber ID");
        }

        const pipeline = [
            {
                $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelDetails"
                }
            },
            {
                $unwind: "$channelDetails"
            },
            {
                $project: {
                    _id: 0,
                    channelId: "$channelDetails._id",
                    username: "$channelDetails.username",
                    avatar: "$channelDetails.avatar"
                }
            }
        ];

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };

        const result = await Subscription.aggregatePaginate(
            Subscription.aggregate(pipeline),
            options
        );

        return res
        .status(200)
        .json(new ApiResponse(200, result, "Subscribed channels fetched successfully"));

    } catch (error) {
        throw new ApiError(400, "Error in fetching subscribed channel")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}