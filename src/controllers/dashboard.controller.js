import mongoose from 'mongoose'
import { Like } from '../models/like.model'
import { ApiError } from '../utils/ApiError'
import { Video } from '../models/video.model'
import { Comment } from '../models/comment.model'
import { APiResponse } from '../utils/ApiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { Subscription } from '../models/subscription.model'

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const totalVideos = await Video.countDocuments({ owner: userId })

    const videoStats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                videoIds: { $push: "$_id" }
            }
        }
    ])

    const videoIds = videoStats[0]?.videoIds || []

    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } })
    const totalComments = await Comment.countDocuments({ video: { $in: videoIds } })
    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    return res.status(200).json(
        new APiResponse(200,
            {
                totalVideos,
                totalViews: videoStats[0]?.totalViews || 0,
                totalLikes,
                totalComments,
                totalSubscribers,
            },
            "Channel stats fetched successfully"
        )
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", order = "asc" } = req.query

    if (!channelId) {
        throw new ApiError(400, "ChannelId is not provided")
    }

    const skip = (parseInt(page - 1)) * parseInt(limit)

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                likeCount: { $size: "$likes" },
                commentCount: { $size: "$comments" }
            }
        },
        {
            $sort: {
                [sortBy]: order === 'asc' ? 1 : -1
            }
        },
        {
            $skip: skip
        }, {
            $limit: parseInt(limit)
        }
    ])

    return res.status(200).json(
        new APiResponse(200, videos, "Channel videos fetched successfully")
    )

})

export {
    getChannelStats,
    getChannelVideos
}