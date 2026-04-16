"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Plus, ChevronsLeft, Trash2, LogOut } from "lucide-react";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";

interface ChatMenu {
    _id: string;
    title: string;
    createdAt: string;
}

export default function Sidebar() {
    const [chats, setChats] = useState<ChatMenu[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        fetch("/api/chat")
            .then(res => res.json())
            .then(data => {
                if (data.chats) setChats(data.chats);
            })
            .catch(err => console.error(err));
    }, [pathname]);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const handleDelete = async (chatId: string) => {
        if (confirm("Are you sure you want to delete this chat?")) {
            try {
                const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
                if (res.ok) {
                    setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
                    if (pathname === `/chat/${chatId}`) {
                        router.push('/');
                    }
                } else {
                    const errorData = await res.json();
                    alert(`Failed to delete chat: ${errorData.error}`);
                }
            } catch (error) {
                console.error("Delete chat error:", error);
                alert("An unexpected error occurred while deleting the chat.");
            }
        }
    };

    return (
        <div className={clsx(
            "h-full bg-transparent border-r border-[#d4d0d8] flex flex-col transition-all duration-300 ease-in-out relative z-20",
            isCollapsed ? "w-20" : "w-64"
        )}>
            <div className="p-4 border-b border-[#d4d0d8] flex items-center justify-center">
                <Link href="/" className={clsx(
                    "flex items-center gap-2 p-2.5 w-full bg-white text-gray-900 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] rounded-xl transition-all text-sm font-medium",
                    isCollapsed ? "justify-center" : "justify-center"
                )}>
                    <Plus className="w-4 h-4" />
                    {!isCollapsed && <span>New Analysis</span>}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div className={clsx("flex items-center px-2", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
                            Recent
                        </div>
                    )}
                    <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronsLeft className={clsx("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {chats.length === 0 ? (
                        !isCollapsed && <div className="text-sm text-gray-400 px-2">No history found.</div>
                    ) : (
                        chats.map(chat => (
                            <div key={chat._id} className="relative group">
                                <Link
                                    href={`/chat/${chat._id}`}
                                    className={clsx(
                                        "flex items-center gap-3 p-2.5 rounded-xl text-sm transition-all cursor-pointer w-full tracking-wide",
                                        pathname === `/chat/${chat._id}`
                                            ? "bg-white text-gray-900 font-medium shadow-sm border border-white"
                                            : "text-gray-500 hover:bg-white/50 hover:text-gray-900 border border-transparent",
                                        isCollapsed && "justify-center"
                                    )}
                                >
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate flex-1">{chat.title}</span>}
                                </Link>
                                {!isCollapsed && (
                                    <button
                                        onClick={() => handleDelete(chat._id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-t border-[#d4d0d8] relative mt-auto">
                {showProfileMenu && !isCollapsed && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 z-50">
                        <div className="px-2 py-1 text-sm text-gray-900 truncate font-semibold">{session?.user?.name || "Analyzer"}</div>
                        <div className="px-2 text-xs text-gray-500 truncate mb-2">{session?.user?.email || "user@plasma.app"}</div>
                        <div className="h-px bg-gray-100 my-1.5"></div>
                        <button 
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => {
                        if (isCollapsed) {
                            signOut({ callbackUrl: '/login' });
                        } else {
                            setShowProfileMenu(!showProfileMenu);
                        }
                    }}
                    className={clsx(
                        "flex items-center gap-3 p-2 w-full hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-xl transition-all cursor-pointer",
                        isCollapsed ? "justify-center" : "justify-between"
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        {!isCollapsed && (
                            <div className="text-sm font-medium text-gray-700 truncate">
                                {session?.user?.name || "Profile"}
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}