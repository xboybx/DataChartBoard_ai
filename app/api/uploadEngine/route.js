import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Dataset from "@/models/Dataset";
import Papa from "papaparse";
import ImageKit, { toFile } from "@imagekit/nodejs";

// New @imagekit/nodejs SDK uses only privateKey for server-side auth
const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export async function POST(req) {
    try {
        // 1. Check Authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

        await dbConnect();

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Process File Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const csvString = buffer.toString();

        // 3. Parse CSV locally
        const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        if (parsed.data.length === 0) {
            return NextResponse.json({ error: "The file appears to be empty" }, { status: 400 });
        }

        // 4. Upload to ImageKit using new SDK — toFile() wraps Buffer correctly
        const uploadResult = await client.files.upload({
            file: await toFile(buffer, file.name),
            fileName: file.name,
            folder: `/user_${session.user.id}/datasets`
        });

        // 5. Save to MongoDB
        const newDataset = await Dataset.create({
            userId: session.user.id,
            fileName: file.name,
            fileUrl: uploadResult.url,
            headers: Object.keys(parsed.data[0] || {}),
            previewData: parsed.data.slice(0, 100),
            totalRows: parsed.data.length
        });

        return NextResponse.json({
            message: "Dataset uploaded successfully",
            datasetId: newDataset._id
        }, { status: 201 });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
    }
}
