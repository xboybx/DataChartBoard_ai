import mongoose from "mongoose";

const DatasetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String, // Store ImageKit URL or local path
        required: true,
    },
    // We store the first 100 rows or metadata for Quick AI Context
    previewData: {
        type: Array, 
        default: [],
    },
    headers: {
        type: Array,
        default: [],
    },
    totalRows: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Dataset || mongoose.model("Dataset", DatasetSchema);
