import { Comment } from '../models/comment.model'
import { asyncHandler } from '../utils/asyncHandler'
import { Video } from '../models/video.model'
import { ApiError } from '../utils/ApiError.js'
import { APiResponse } from '../utils/ApiResponse.js'

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const videoExists = await Video.findById(videoId)
    if (!videoExists) {
        throw new ApiError(404, "Video not found")
    }

    const comments = await Comment.find({ video: videoId })
        .populate("commentedBy", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const totalComments = await Comment.countDocuments({ video: videoId })

    return res.status(200).json(
        new APiResponse(200, comments, { pagination: { total: totalComments, page, limit, totalPages: Math.ceil(totalComments / limit) } }, "Comment fetched Successfully")
    )

})

const addVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: video._id,
        owner: userId,
    });

    return res.status(200).json(
        new APiResponse(200, comment, "Comment added successfully")
    );
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    const userId = req.user._id

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content } },
        { new: true }
    )

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update/delete this comment")
    }

    return res.status(200).json(
        new APiResponse(200, comment, "Comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (!comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "your are not authorized to update/delete this comment")
    }

    await comment.deleteOne()

    return res.status(200).json(
        new APiResponse(200, null, "Comment deleted successfully")
    )

})

export {
    getVideoComments,
    addVideoComment,
    updateComment,
    deleteComment
}