import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Schema } from "mongoose";
import { Comment } from "../models/comment.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    try {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const videoExists = await Video.exists({ _id: videoId });
        if (!videoExists) {
            throw new ApiError(404, "Video not found");
        }

        const commentsAggregate = Comment.aggregate([
                {
                    $match: {
                        video: new mongoose.Types.ObjectId(videoId)
                    }
                },
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
                        foreignField: "comment",
                        as: "likes"
                    }
                },
                {
                    $addFields: {
                        likesCount: {
                            $size: "$likes"
                        },
                        owner: {
                            $first: "$owner"
                        },
                        isLiked: {
                            $cond: {
                                if: { $in: [req.user?._id, "$likes.likedBy"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $project: {
                        content: 1,
                        createdAt: 1,
                        likesCount: 1,
                        owner: {
                            username: 1,
                            fullName: 1,
                            "avatar.url": 1
                        },
                        isLiked: 1
                    }
                }
            ]);

            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10)
            };

            const comments = await Comment.aggregatePaginate(
                commentsAggregate,
                options
            );

    

        return res.status(200).json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        );
    } catch (error) {
        console.error("Error fetching video comments:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong while fetching comments"));
    }

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    
    try {
        if (!isValidObjectId(videoId)) {
            throw new ApiError( 400 , "invalid tweet object Id" )
        }  
        if (!content || content.trim() === "") {
            throw new ApiError( 400 , "Content is required" )
        }

        const videoExists = await Video.exists({ _id: videoId });
        if (!videoExists) {
            throw new ApiError(404, "Video not found");
        }

        const newComment = await Comment.create({
            content,
            video: videoId,
            owner: req.user._id
        });

        if (!newComment) {
            throw new ApiError(500, "Failed to create comment");
        }

        const comment = await Comment.aggregate([
            {
                $match: { _id: newComment._id }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
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
        ]);

        return res.status(201).json(
            new ApiResponse(201, result[0], "Comment added successfully")
        );

    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    try {
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID");
        }

        if (!content || content.trim() === "") {
            throw new ApiError(400, "Comment content is required");
        }

        // Ensure comment exists and belongs to user
        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, owner: userId },
            { $set: { content: content.trim() } },
            { new: true }
        );

        if (!comment) {
            throw new ApiError(404, "Comment not found or unauthorized");
        }

        // Use aggregation to return updated comment with owner's info
        const result = await Comment.aggregate([
            { $match: { _id: comment._id } },
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
        ]);

        return res.status(200).json(
            new ApiResponse(200, result[0], "Comment updated successfully")
        );


    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json(new ApiError(500, "Something went wrong while updating the comment"));
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params ;
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError( 400 , "invalid tweet object Id" )
    }

    const result = await Comment.findByIdAndDelete( commentId ) ; 

    console.log(result) ;

    if( ! result ){
        new ApiError( 500 , "error while deleting comment" )
    }

    return res.status(200).json(
        new ApiResponse(200 , {} , "comment deleted successfully"   )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}