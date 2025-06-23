
import mongoose from "mongoose"
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { APiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from '../models/subscription.model.js'

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id

    if (!channelId) {
        throw new ApiError(400, "ChannelId is required")
    }

    if (channelId === userId) {
        throw new ApiError(400, "You can not subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({ channel: channelId, subscriber: userId })

    if (existingSubscription) {
        await existingSubscription.deleteOne()
        return res.status(200).json(new APiResponse(200, null, "Channel unsubscribed"))
    }

    await Subscription.create({ channel: channelId, subscriber: userId })

    return res.status(200).json(new APiResponse(200, null, "Channel subscribed"))

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!channelId) {
        throw new ApiError(400, "ChannelId not found")
    }

    const channel = await User.findById(channelId).select("blockedUsers")
    if (!channel) throw new ApiError(404, "Channel not found")

    const blockedUsers = await channel.blockedUsers || []

    const subscribers = await Subscription.aggregate([
        {
            $match: new mongoose.Types.ObjectId(channelId),
            subscriber: { $nin: blockedUsers }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriberInfo'
            }
        },
        {
            $unwind: '$subscriberInfo'
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriberInfo._id",
                username: "$subscriberInfo.username",
                email: "$subscriberInfo.email",
                fullname: "$subscriberInfo.fullname",
                avatar: "$subscriberInfo.avatar"
            }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res.status(200).json(new APiResponse(200, subscribers, "Subscriber fetched successfully"))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    const userId = req.user._id

    const user = await User.findById(userId).select("blockedUsers")
    const blockedUsersIds = user?.blockedUsers || []

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: new mongoose.Types.ObjectId(subscriberId),
            channel: { $nin: blockedUsersIds }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: "channelInfo"
            }
        },
        {
            $unwind: '$channelInfo'
        },
        {
            $project: {
                _id: 0,
                channelId: "$channelInfo._id",
                username: "$channelInfo.username",
                email: "$channelInfo.email",
                fullname: "$channelInfo.fullname",
                avatar: "$channelInfo.avatar",
                coverImage: "$channelInfo.coverImage"
            }
        },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ])

    return res.status(200).json(
        new APiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    )

})

const getSubscriberCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "ChannelId is required")
    }

    const count = await Subscription.countDocuments({ channel: channelId })

    return res.status(200).json(new APiResponse(200, { count }, "Subscriber count fetched"))

})

const checkIsSubscribed = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id

    if (!channelId) throw new ApiError(400, "ChannelId not provided")

    const exists = await Subscription.exists({ subscriber: userId, channel: channelId })

    return res.status(200).json(
        new APiResponse(200, { isSubscribed: !!exists }, "Subscription fetched successfully")
    )

})


const getTopSubscribedChannels = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    const topChannel = await Subscription.aggregate([
        {
            $group: {
                _id: "$channel",
                subscriberCount: { $sum: 1 }
            }
        },
        {
            $sort: { subscriberCount: -1 }
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'channelInfo'
            }
        },
        {
            $unwind: "$channelInfo"
        },
        {
            $project: {
                channelId: "$_id",
                username: "$channelInfo.username",
                avatar: "$channelInfo.avatar",
                subscriberCount: 1
            }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, topChannel, "Top channels fetched successfully")
    )

})

export const getMonthlySubscribersStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const stats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                "_id.year": -1,
                "_id.month": -1
            }
        },
        {
            $limit: 6
        },
        {
            $project: {
                month: "$_id.month",
                year: "$_id.year",
                count: 1,
                _id: 0
            }
        }
    ])

    return res.status(200).json(
        new APiResponse(200, stats.reverse(), "Monthly subscriber stats fetched")
    )

})

export const getMutualSubscription = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { otherUserId } = req.params


    if (!otherUserId) {
        throw new ApiError(400, "Other user id is not provided")
    }

    const [userSubs, otherSubs] = await Promise.all([
        Subscription.find({ subscriber: userId }).select("channel"),
        Subscription.find({ subscriber: otherUserId }).select("channel")
    ])

    const userChannels = new Set(userSubs.map(sub => sub.channel.toString()))
    const mutualChannelIds = otherSubs
        .map(sub => sub.channel.toString())
        .filter(id => userChannels.has(id))

    const mutualChannels = await mongoose.model("User").find({
        _id: { $in: mutualChannelIds }
    }).select("username avatar fullname")

    return res.stats(200).json(
        new APiResponse(200, mutualChannels, "Mutual subscription found")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}