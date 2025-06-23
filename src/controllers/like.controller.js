import mongoose from 'mongoose'
import { Like } from '../models/like.model.js'
import { ApiError } from '../utils/apiError.js'
import { Tweet } from '../models/tweet.model.js'
import { APiResponse } from '../utils/apiResponse.js'
import { Comment } from '../models/comment.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if (!videoId) {
        throw new ApiError(400, "Video id is requierd")
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(new APiResponse(200, null, 'Video Unliked'))
    }

    await Like.create({ video: videoId, likedBy: userId })

    return res.status(200).json(new APiResponse(200, null, "Video Liked"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Valid commentId is required");
    }

    const commentExists = await Comment.exists({ _id: commentId });
    if (!commentExists) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new APiResponse(200, null, "Comment unliked"));
    }

    await Like.create({ comment: commentId, likedBy: userId });

    return res.status(200).json(new APiResponse(200, null, "Comment liked"));
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id

    if (!tweetId || !mongoose.Types.ObjectId(tweetId)) {
        throw new ApiError(400, "Invalid TweetId")
    }

    const tweetExists = await Like.findOne({ tweet: tweetId, likedBy: userId })

    if (tweetExists) {
        await tweetExists.deleteOne()
        return res.status(200).json(new APiResponse(200, null, "Tweet Unliked"))
    }

    await Like.create({ tweet: tweetId, likedBy: userId })

    return res.status(200).json(new APiResponse(200, null, "Tweet Liked"))

}
)

const getTotalLikesOnVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const totalLikes = await Like.countDocuments({ video: videoId })

    return res.status(200).json(
        new APiResponse(200, { totalLikes }, "Likes fetched successfully")
    )
})


const getVideosLikedByUser = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from: 'users',
                localField: 'video.owner',
                foreignField: '_id',
                as: 'video.owner'
            }
        },
        {
            $unwind: '$video.owner'
        },
        {
            $project: {
                _id: 0,
                likedAt: "$createdAt",
                videoId: "$video._id",
                title: "$video.title",
                thumbnail: "$video.thumbnail",
                views: "$video.views",
                owner: {
                    _id: "$video.owner._id",
                    name: "$video.owner.name",
                    avatar: "$video.owner.avatar"
                }
            }
        },
        {
            $sort: { likedAt: -1 }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, { totalLikedVideos: likedVideos.length, videos: likedVideos }, "Liked videos fetched successfully")
    )

})


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getTotalLikesOnVideo,
    getVideosLikedByUser
}