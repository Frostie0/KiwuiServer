import mongoose from "mongoose";

const commentaryScheama = new mongoose.Schema({
    commentId: {
        type: String,
        require: true,
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
        require: true
    },
    type: {
        type: String,
    }

}, { timestamps: true })

const AlertSchema = new mongoose.Schema({
    alertId: {
        type: String,
        require: true,
        unique: true,
    },
    userId: {
        type: String,
        require: true,
    },
    title: {
        type: String
    },
    coordinate: {
        latitude: {
            type: Number,
            require: true
        },
        longitude: {
            type: Number,
            require: true
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