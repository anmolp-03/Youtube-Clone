import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


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
            .json(new ApiResponse(200, { subscribedTo: channelId }, `Successfully ${action} to ${channelId}`));


    } catch (error) {
        console.error("Toggle subscription failed:", error); // Show actual error
        throw new ApiError(500, error.message || "Error in toggle subscription");
    }
})

// controller to return subscriber list of any channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const  channelId  = req.params.channelId; // Use channelId from params or user context

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel object Id");
    }

    const SubscribeToList = await Subscription.find({ channel: channelId })
        .populate('subscriber', 'avatar username')
        .exec();

    if (!SubscribeToList || SubscribeToList.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "User has not subscribed to any channel")
        );
    }

    const subscribersWithCountAndStatus = await Promise.all(
        SubscribeToList.map(async (subscription) => {
            const subscriber = subscription.subscriber;

            const subscriberCount = await Subscription.countDocuments({ channel: subscriber._id });

            const subStatus = await Subscription.findOne({
                subscriber: channelId,
                channel: subscriber._id
            });

            return {
                subscriberId: subscriber._id,
                username: subscriber.username,
                avatar: subscriber.avatar,
                subscriberCount,
                isSubscribedByMe: !!subStatus
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, subscribersWithCountAndStatus, "List of subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const  currId  = req.params.currId // Use subscriberId from params or user contex
    const { page = 1, limit = 10 } = req.query;
    try {

        if (!isValidObjectId(currId)) {
            throw new ApiError(400, "Invalid subscriber ID");
        }

        console.log("Current User ID:", currId);
        console.log("Page:", page, "Limit:", limit);


        const subscribedChannels = await Subscription.find({ subscriber: currId })
            .populate('channel', 'avatar username') 
            .exec();

        if (!subscribedChannels || subscribedChannels.length === 0) {
            return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    [],
                    "user has not subscribed any channel"
                )
            );
        }
        
        const channelsWithSubscriberCount = await Promise.all(
            subscribedChannels.map(async (subscription) => {
                const channel = subscription.channel;

                const subscriberCount = await Subscription.countDocuments({ channel: channel._id });
                return {
                    channelId: channel._id,
                    username: channel.username,
                    avatar: channel.avatar,
                    subscriberCount,  
                };
            })
        );

        return res
        .status(200)
        .json(new ApiResponse(200, channelsWithSubscriberCount, "Subscribed channels fetched successfully"));

    } catch (error) {
        throw new ApiError(400, "Error in fetching subscribed channel")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}