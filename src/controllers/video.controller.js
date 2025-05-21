import { Video } from "../models/video.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { User } from "../models/user.model";
import mongoose, { isValidObjectId } from "mongoose";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // This array will store all the steps of our aggregation pipeline
    const pipeline =[]

    // 1. Full-Text Search (only works if search index is set in MongoDB Atlas)
    // This allows searching by video title or description
    if(query){
        pipeine.push({
            $search: {
                index: 'search-videos',
                text: {
                    query: query,
                    path: ["title", "description"],
                }
            }
        })
    }

    //filter by userId

    if(userId){
        if(!isValidObjectId(userId)) throw new ApiError(400, "UserId not found")

        // Add match stage to only get videos owned by this user
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // 3. Filter only published videos (don't show unpublished or drafts)
    pipeline.push({
        $match: { isPublished: true }
    });

    // ✅ 4. Sort the videos by given field (createdAt, views, duration, etc.)
    // and order (asc/desc)
    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1 // ascending = 1, descending = -1
        }
    });

    // Stage 5: Lookup owner details from the 'users' collection
    pipeline.push(
        {
            $lookup: {
                from: "users", // Collection name in lowercase & plural
                localField: "owner", // video.owner
                foreignField: "_id", // user._id
                as: "ownerDetails", // Output array
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails" // Flatten the array to object
        }
    );

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (title?.trim() === "" || description?.trim() === "") {
        throw new ApiError(400, "Title and Description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if ( !videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required");
    }

    // Upload to cloudinary
    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload.url || !thumbnailUpload.url) {
        throw new ApiError(500, "Upload failed");
    }

    // Step 4: Extract details
    const videoOwner = req.user?._id;

    const durationInSeconds = video?.duration;

    const newVideo = await Video.create({
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        duration: durationInSeconds,
        views: 0, 
        isPublished: true,
        owner: videoOwner,
    });

    if (!newVideo) {
        throw new ApiError(500, "something went wrong while uploading video");
    }

    const createdVideo = await User.findById(newVideo._id).select("-isPublished");

    return res
    .status(201)
    .json(new ApiResponse(200, createdVideo, "video uploaded successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find video by ID, exclude 'isPublished' field, and populate owner details (username & avatar)
    const searchedVideo = await Video.findById(videoId)
        .select("-isPublished")
        .populate("owner", "username avatar");

    // If video not found, throw 404 error
    if (!searchedVideo) {
        throw new ApiError(404, "Video not found or doesn't exist");
    }

    // Send back the video data with success message
    return res
    .status(200)
    .json(new ApiResponse(200, searchedVideo, "Video fetched successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0]; 

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (thumbnailFile) {
        const thumbnail = await uploadOnCloudinary(thumbnailFile.path, "videos/thumbnails");
        updateData.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, { new: true }).select("-isPublished").populate("owner", "username avatar");

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const deletedVideo = await Video.findByIdAndDelete(videoId);

        if (!deletedVideo) {
            throw new ApiError(404, "Video not found");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully"));

    } catch (error) {
        throw new ApiError(400, "error while deleting video: " ,err);
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not allowed to modify this video");
        }

        video.isPublished = !video.isPublished;

        await video.save({ validateBeforeSave: false });

        return res.status(200).json(
        new ApiResponse(200, { videoId: video._id, isPublished: video.isPublished },"Publish status toggled successfully"));

    } catch (error) {
        throw error;
    }
})

const addView = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    video.views += 1;

    await video.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(200, { views: video.views }, "View added successfully")
    );
  } catch (error) {
    throw error;
  }
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addView
}