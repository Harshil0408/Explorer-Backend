import mongoose from 'mongoose'
import { Video } from '../models/video.model'
import { asyncHandler } from '../utils/asyncHandler'
import { Like } from '../models/like.model'
import { Comment } from '../models/comment.model'
import { Subscription } from '../models/subscription.model'
import { APiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'

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

    if (!channelId) {
        throw new ApiError(400, "ChannelId is not provided")
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .select("title thumbnail views createdAt")

    return res.status(200).json(
        new APiResponse(200, videos, "Channel videos fetched successfully")
    )

})

export {
    getChannelStats,
    getChannelVideos
}