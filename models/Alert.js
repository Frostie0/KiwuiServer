import mongoose from "mongoose";

const commentaryScheama = new mongoose.Schema({
    commentId: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
    },
    comment:
    {
        type: String,
    },
    likes: [
        {
            type: String
        }
    ],
    dislikes: [
        {
            type: String
        }
    ],
    reportCount: {
        type: Number,
        default: 0
    },
    reportHistory: [
        {
            userId: {
                type: String
            },
            count: {
                type: Number
            }
        }
    ],
    userId: {
        type: String,
    },
    type: {
        type: String,
    }

}, { timestamps: true })

const AlertSchema = new mongoose.Schema({
    alertId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String
    },
    coordinate: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    description: {
        type: String
    },
    reportCount: {
        type: Number,
        default: 0
    },
    reportHistory: [
        {
            userId: {
                type: String
            },
            count: {
                type: Number
            }
        }
    ],
    likes: [
        {
            type: String
        }
    ],
    dislikes: [
        {
            type: String
        }
    ],
    commentary: [commentaryScheama],

}, { timestamps: true })

export const Alert = mongoose.model("Alert", AlertSchema);

export default Alert;
