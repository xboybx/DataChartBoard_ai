import Sidebar from "@/components/Sidebar";
import FileUploader from "@/components/FileUploader";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen w-full bg-[#f1eef1] text-gray-900 font-sans tracking-tight">
            <Sidebar />

            <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
                {/* Soft gradient orb in background */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="max-w-2xl w-full text-center mb-10 relative z-10">
                    <h1 className="text-4xl font-medium tracking-tight text-[#111] mb-3">Welcome, {session.user?.name || "Analyzer"}</h1>
                    <p className="text-gray-500 font-normal tracking-wide text-lg">Upload a dataset to start a new analysis session.</p>
                </div>

                <div className="w-full">
                    <FileUploader />
                </div>
            </main>
        </div>
    );
}