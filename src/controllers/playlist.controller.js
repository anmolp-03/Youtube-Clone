import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user?._id;

    //TODO: create playlist
    try {
        if (!name || !description) {
            throw new ApiError(400, "Name and description are required");
        }

        // Create new playlist
        const newPlaylist = await Playlist.create({
            name,
            description,
            owner: userId,
            videos: []
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newPlaylist, "Playlist created successfully"));

    } catch (error) {
        console.error("Error creating playlist:", error);
        throw new ApiError(500, "Failed to create playlist");
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.params.userId
    //TODO: get user playlists

    try {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }

        // Check if the user exists
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            throw new ApiError(404, "User not found");
        }

        // Retrieve playlists for the user
        const playlists = await Playlist.find({ owner: userId })
            .select("name description videos createdAt")
            .populate("videos", "title thumbnail duration")
            .sort({ createdAt: -1 }) // Sort by creation date, most recent first;

        return res
            .status(200)
            .json(new ApiResponse(200, playlists, "User playlists retrieved successfully"));

    } catch (error) {
        console.error("Error fetching user playlists:", error);
        throw new ApiError(500, "Failed to fetch user playlists");
    }

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId
    //TODO: get playlist by id

    try {
        // Validate playlist ID
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        // Find the playlist and populate video details
        const playlist = await Playlist.findById(playlistId)
            .populate("videos", "title thumbnail duration")
            .populate("owner", "username avatar")


        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Playlist retrieved successfully"));

    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw new ApiError(500, "Failed to fetch playlist");
    }
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    try {
        // Validate IDs
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }

        // Check if playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Check if video exists
        const videoExists = await Video.exists({ _id: videoId });
        if (!videoExists) {
            throw new ApiError(404, "Video not found");
        }

        // Check if video is already in the playlist
        if (playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video already exists in playlist");
        }

        // Add video to playlist
        playlist.videos.push(videoId);
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));

    } catch (error) {
        console.error("Error adding video to playlist:", error);
        throw new ApiError(500, "Failed to add video to playlist");
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    try {
        // Validate IDs
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid playlist or video ID");
        }

        // Check if playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Check if video exists in the playlist
        const videoIndex = playlist.videos.indexOf(videoId);
        if (videoIndex === -1) {
            throw new ApiError(400, "Video not found in playlist");
        }

        // Remove video from playlist
        playlist.videos.splice(videoIndex, 1);
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));

    } catch (error) {
        console.error("Error removing video from playlist:", error);
        throw new ApiError(500, "Failed to remove video from playlist");
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId
    // TODO: delete playlist

    try {
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        // Check if playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Delete the playlist
        await Playlist.findByIdAndDelete(playlistId);

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Playlist deleted successfully"));

    } catch (error) {
        console.error("Error deleting playlist:", error);
        throw new ApiError(500, "Failed to delete playlist");
    }
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId
    const {name, description} = req.body
    //TODO: update playlist

    try {
        // Validate playlist ID
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }

        // Check if playlist exists
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Update playlist details
        if (name) playlist.name = name;
        if (description) playlist.description = description;
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
            
    } catch (error) {
        console.error("Error updating playlist:", error);
        throw new ApiError(500, "Failed to update playlist");
    }
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}