import mongoose from "mongoose";

const videoViewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

export const VideoView = mongoose.model("VideoView", videoViewSchema);
