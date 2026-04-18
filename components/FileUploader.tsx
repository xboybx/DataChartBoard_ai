"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import clsx from "clsx";

export default function FileUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !message || isUploading) return;

        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await fetch("/api/uploadEngine", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                throw new Error(errorData.error || "Upload failed");
            }

            console.log("The file Uploaded Sucesfully")

            const uploadData = await uploadRes.json();
            const datasetId = uploadData.datasetId;

            console.log("waiting  for ai respones")
            const chatRes = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ datasetId, message }),
            });

            if (!chatRes.ok) {
                const errorData = await chatRes.json();
                throw new Error(errorData.error || "Chat creation failed");
            }

            console.log("Ai responded")
            console.log("new Chat created sucesfullly")
            const chatData = await chatRes.json();
            router.push(`/chat/${chatData.chatId}`);
            router.refresh();

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            alert(`An error occurred: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
            <h2 className="text-2xl font-medium tracking-tight mb-6 text-center text-[#111]">New Dataset</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-600 tracking-wide">Upload CSV</label>
                    <label
                        htmlFor="fileUpload"
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={clsx(
                            "cursor-pointer flex flex-col items-center justify-center w-full p-8 border border-dashed rounded-2xl transition-all",
                            isDragOver ? "border-purple-400 bg-purple-50/50" : "border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400"
                        )}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="fileUpload"
                            disabled={isUploading}
                        />
                        <UploadCloud className="h-10 w-10 text-gray-500 mb-3" />
                        <span className="text-sm font-semibold text-gray-300">
                            {file ? file.name : "Drag & drop or click to upload"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">CSV files only (max 1000 rows)</span>
                    </label>
                </div>

                <div className="space-y-2">
                    <label htmlFor="initialQuestion" className="block text-sm font-medium text-gray-600 tracking-wide">What do you want to see?</label>
                    <input
                        id="initialQuestion"
                        type="text"
                        className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-2xl py-3.5 px-5 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 text-sm transition-all placeholder:text-gray-400"
                        placeholder="e.g., Create a bar chart of total sales by region"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isUploading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-gray-900 text-white rounded-2xl py-3.5 text-sm font-medium hover:bg-black hover:shadow-lg transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md"
                    disabled={isUploading || !file || !message}
                >
                    {isUploading ? "Processing..." : "Start Analysis"}
                </button>
            </form>
        </div>
    );
}