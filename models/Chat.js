import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    datasetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dataset",
        required: true,
    },
    title: {
        type: String,
        default: "New Conversation",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
