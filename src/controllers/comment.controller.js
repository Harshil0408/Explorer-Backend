import { ApiError } from '../utils/ApiError.js'
import { Video } from '../models/video.model.js'
import { Comment } from '../models/comment.model.js'
import { APiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const videoExists = await Video.findById(videoId)
    if (!videoExists) {
        throw new ApiError(404, "Video not found")
    }

    const allComments = await Comment.find({ video: videoId })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 })
        .lean()

    const commentMap = {}
    const roots = []

    allComments.forEach((comment) => {
        comment.replies = []
        commentMap[comment._id] = comment
    })

    allComments.forEach((comment) => {
        if (comment.parentComment) {
            const parent = commentMap[comment.parentComment]
            if (parent) {
                parent.replies.push(comment)
            }
        } else {
            roots.push(comment)
        }
    })

    return res.status(200).json(
        new APiResponse(200, roots, "Nested comments fetched successfully")
    )

})

const addVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id
    const { content, parentComment } = req.body

    if (!content || content.trim() === '') {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (parentComment) {
        const parent = await Comment.findById(parentComment)
        if (!parent) {
            throw new ApiError(404, "Comment not found")
        }
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: video._id,
        owner: userId,
        parentComment: parentComment || null
    })

    return res.status(200).json(
        new APiResponse(200, comment, "Comment added successfully")
    )

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