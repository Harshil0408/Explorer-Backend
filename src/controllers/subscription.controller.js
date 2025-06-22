
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from '../models/subscription.model.js'
import { APiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import mongoose from "mongoose"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user._id

    if (!channelId) {
        throw new ApiError(400, "ChannelId is required")
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

    if (!channelId) {
        throw new ApiError(400, "ChannelId not found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: new mongoose.Types.ObjectId(channelId)
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
        }
    ])

    return res.status(200).json(new APiResponse(200, subscribers, "Subscriber fetched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400, "SubscriberId is required")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: new mongoose.Types.ObjectId(subscriberId)
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
        }
    ])

    return res.status(200).json(
        new APiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}