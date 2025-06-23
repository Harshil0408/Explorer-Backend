import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoFile: { type: String, required: true },
    videoPublicId: { type: String, required: true },
    thumbnail: { type: String, required: true },
    thumbnailPublicId: { type: String, required: true },
    duration: { type: String, required: true },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    tags: [{ type: String, trim: true, lowercase: true }],
    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportReason: { type: String },
    language: { type: String, trim: true, lowercase: true },
    category: { type: String, trim: true, lowercase: true },
    averageWatchTime: { type: Number, default: 0 }

}, {
    timestamps: true
});


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
