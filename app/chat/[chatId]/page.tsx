import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

// In Next.js, params can be a Promise and must be awaited in certain cases
export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const { chatId } = await params;

    return (
        <div className="flex h-screen w-full bg-[#f1eef1] text-gray-900 font-sans tracking-tight">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Navbar />
                <ChatInterface chatId={chatId} />
            </div>
        </div>
    );
}