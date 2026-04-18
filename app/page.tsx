import Sidebar from "@/components/Sidebar";
import FileUploader from "@/components/FileUploader";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen w-full bg-[#f1eef1] text-gray-900 font-sans tracking-tight">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />

                <main className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto relative">
                    {/* Soft gradient orb in background */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="max-w-2xl w-full text-center mb-10 relative z-10">
                        <h1 className="text-4xl font-medium tracking-tight text-[#111] mb-3">Welcome, {session.user?.name || "Analyzer"}</h1>
                        <p className="text-gray-500 font-normal tracking-wide text-lg">Upload a dataset to start a new analysis session.</p>
                    </div>

                    <div className="w-full">
                        <FileUploader />

                        {/* Instructional Section */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                            <div className="p-5 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all hover:bg-white/60">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    </span>
                                    Step 1: Upload
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                                    Upload any <strong>CSV file</strong> containing your data. Our AI will automatically parse and prepare it for analysis.
                                </p>
                            </div>

                            <div className="p-5 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all hover:bg-white/60">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                                    </span>
                                    Step 2: Ask & Visualize
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                                    Ask specific questions about your data or tell it to <strong>"visualize the data"</strong> to generate beautiful charts instantly.
                                </p>
                            </div>
                        </div>


                    </div>
                </main>
            </div>
        </div>
    );
}