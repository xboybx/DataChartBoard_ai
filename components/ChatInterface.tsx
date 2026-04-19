"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, BarChart2, X } from "lucide-react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChartDisplay from "./ChartDisplay";
import ErrorBoundary from "./ErrorBoundary";

type Message = {
    _id?: string;
    role: "user" | "assistant";
    content: string;
    chartData?: any;
};

interface ChartDataset {
    label: string;
    data: any[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
}

interface ChartInfo {
    type: string;
    data: {
        labels: string[];
        datasets: ChartDataset[];
    };
    options?: any;
}


export default function ChatInterface({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeChartData, setActiveChartData] = useState<any | null>(null);
    const [chatWidth, setChatWidth] = useState(30); // Default 30% split for enterprise layout
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            // Calculate width percentage relative to the chat container area
            const newChatWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Limit between 25% and 75%
            if (newChatWidthPercent >= 25 && newChatWidthPercent <= 75) {
                setChatWidth(newChatWidthPercent);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    //To fetch all messages releated to this specific chat 
    useEffect(() => {
        setIsFetching(true);
        fetch(`/api/chat/${chatId}`)
            .then(res => res.json())
            .then(data => {
                setMessages(data.messages || []);
            })
            .catch(err => {
                console.error("Failed to fetch chat:", err);
                setMessages([]); // Ensure messages is an array on error
            })
            .finally(() => setIsFetching(false));
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* To send the chat input to backend */
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch(`/api/chat/${chatId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.content })
            });

            const data = await res.json();


            // Handle API Errors (Rate limits, etc.)
            if (!res.ok) {
                const errorMsg: Message = {
                    role: "assistant",
                    content: `⚠️ **Error:** ${data.error || "Failed to get a response. Please try again later."}`,
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsLoading(false);
                return;
            }

            const content = data.analysis || data.response;
            let chart = data.chart || data.chartData;

            // Handle charts being an array or a single object
            if (chart) {
                let chartDataArray = Array.isArray(chart) ? chart : [chart];
                chartDataArray.forEach((c: ChartInfo) => {
                    if (c && c.data && c.data.datasets) {
                        c.data.datasets = c.data.datasets.map((dataset: ChartDataset) => ({
                            ...dataset,
                            backgroundColor: dataset.backgroundColor || [
                                'rgba(217, 70, 239, 0.8)', // Fuchsia
                                'rgba(14, 165, 233, 0.8)', // Sky Blue
                                'rgba(168, 85, 247, 0.8)', // Purple
                                'rgba(56, 189, 248, 0.8)', // Lighter blue
                                'rgba(232, 121, 249, 0.8)',// Lighter pink
                                'rgba(129, 140, 248, 0.8)',// Indigo
                            ],
                        }));
                    }
                });
                chart = Array.isArray(chart) ? chartDataArray : chartDataArray[0];
            }

            if (content) {
                const assistantMsg: Message = {
                    role: "assistant",
                    content: content,
                    chartData: chart
                };
                setMessages(prev => [...prev, assistantMsg]);

                if (chart) {
                    setActiveChartData(chart);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const systemError: Message = {
                role: "assistant",
                content: "❌ **Connection Error:** Could not reach the server. Please check your internet and try again."
            };
            setMessages(prev => [...prev, systemError]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="flex h-full w-full items-center justify-center text-gray-500">Loading conversation...</div>;
    }

    return (
        <div ref={containerRef} className="flex w-full h-full bg-[#f8fafc] relative overflow-hidden">
            {/* --- LEFT SIDEBAR: CHAT INTERFACE --- */}
            <div
                className={clsx(
                    "h-full border-r border-gray-200/60 bg-white/50 backdrop-blur-3xl flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)] overflow-hidden",
                    isDragging && "transition-none"
                )}
                style={{ width: `${chatWidth}%` }}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-200/50 bg-white/60">
                    <span className="font-semibold text-gray-800 flex items-center gap-2 tracking-wide">
                        <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
                        AI Data Analyst
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
                    <div className="max-w-md mx-auto w-full space-y-8">
                        {messages.length === 0 && (
                            <div className="text-gray-500 text-center py-20 text-sm">
                                No messages yet. Send a question below!
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            const accentColor = msg.chartData?.data?.datasets?.[0]?.backgroundColor?.[0];

                            return (
                                <div
                                    key={msg._id || `msg-${i}`}
                                    className={clsx(
                                        "w-full flex",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            "max-w-[85%] text-sm rounded-2xl px-6 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]",
                                            msg.role === "user"
                                                ? "bg-white text-gray-900 border border-gray-100 ml-auto rounded-tr-md font-medium"
                                                : "bg-transparent text-gray-800",
                                        )}
                                        style={msg.role === 'assistant' && accentColor ? { borderTopColor: accentColor, borderTopWidth: '2px' } : {}}
                                    >
                                        {msg.content && (
                                            <div className={clsx(
                                                "leading-relaxed",
                                                msg.role === "assistant" && "text-gray-800 text-[15px] space-y-4 [&>h1]:text-2xl [&>h1]:font-medium [&>h1]:text-gray-900 [&>h2]:text-xl [&>h2]:font-medium [&>h2]:text-gray-900 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-900 [&>p]:leading-relaxed [&>ul]:list-outside [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1 [&>ol]:list-outside [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:space-y-1 [&>strong]:font-semibold [&>strong]:text-gray-900 [&>em]:italic [&>pre]:bg-white [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:shadow-sm [&>pre]:border [&>pre]:border-gray-100 [&>pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-sm [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&>pre_code]:bg-transparent [&>pre_code]:p-0"
                                            )}>
                                                {msg.role === "assistant" ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                                )}
                                            </div>
                                        )}

                                        {msg.role === "assistant" && msg.chartData && msg.chartData.length > 0 && (
                                            <button
                                                onClick={() => setActiveChartData(msg.chartData)}
                                                className="mt-4 flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all font-medium text-xs tracking-wide w-full justify-center"
                                            >
                                                <BarChart2 className="w-4 h-4 text-purple-500" />
                                                View Dashboard
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="w-full flex justify-start">
                                <div className="max-w-[85%] bg-transparent text-gray-500 px-6 py-3 flex items-center gap-2 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    Analyzing...
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200/50 bg-white/60 backdrop-blur-md">
                    <div className="max-w-md mx-auto w-full relative">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Ask about your data..."
                                className="w-full bg-white border border-gray-200/60 text-gray-900 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all min-h-[60px] max-h-32 resize-none text-sm shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                                disabled={isLoading}
                                rows={1}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-3 p-2.5 text-white bg-gray-900 rounded-xl hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none shadow cursor-pointer transition-all disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <div className="text-center text-xs text-gray-500 mt-3">
                            AI can make mistakes. Verify important data.
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RESIZE HANDLE --- */}
            <div
                onMouseDown={() => setIsDragging(true)}
                className={clsx(
                    "absolute top-0 bottom-0 w-1.5 cursor-col-resize z-40 transition-colors",
                    isDragging ? "bg-purple-400" : "bg-transparent hover:bg-purple-300/30"
                )}
                style={{ left: `calc(${chatWidth}% - 3px)` }}
            />

            {/* --- RIGHT MAIN STAGE: DASHBOARD --- */}
            <div
                className="flex-1 flex flex-col relative z-20 h-full overflow-hidden bg-gradient-to-br from-gray-50 to-[#f8fafc]"
                style={{ width: `${100 - chatWidth}%` }}
            >
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200/60 bg-white/50 backdrop-blur-xl shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 font-semibold text-gray-800 tracking-wide">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shadow-sm border border-purple-200/50">
                            <BarChart2 className="w-4 h-4 text-purple-600" />
                        </div>
                        Enterprise Insights Console
                    </div>
                    {activeChartData && (
                        <button
                            onClick={() => setActiveChartData(null)}
                            className="text-xs font-semibold px-4 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                        >
                            Clear Screen
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 lg:p-10 flex flex-col justify-start overflow-y-auto w-full relative">
                    <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

                    {activeChartData ? (
                        <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 pb-20 relative z-10">
                            {Array.isArray(activeChartData) ? (
                                activeChartData.map((chartItem, idx) => {
                                    const isFullWidth = (idx === 0 && activeChartData.length % 2 !== 0) || activeChartData.length === 1;
                                    return (
                                        <div
                                            key={idx}
                                            className={clsx(
                                                "w-full shrink-0 border border-white bg-white/70 backdrop-blur-2xl rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-6 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500",
                                                isFullWidth ? "xl:col-span-2" : "col-span-1"
                                            )}
                                        >
                                            <div className="flex items-center justify-between pb-4 border-b border-gray-100/80">
                                                <h3 className="font-semibold text-gray-800 tracking-tight flex items-center gap-2 text-lg">
                                                    <span className="w-2.5 h-2.5 rounded-full shadow-sm bg-purple-500" />
                                                    {chartItem.type ? chartItem.type.charAt(0).toUpperCase() + chartItem.type.slice(1) : "Analysis"} Widget
                                                </h3>
                                            </div>

                                            <div className={clsx("w-full relative", isFullWidth ? "h-[480px]" : "h-[350px]")}>
                                                <ErrorBoundary>
                                                    <ChartDisplay chartData={chartItem} />
                                                </ErrorBoundary>
                                            </div>

                                            {chartItem.explanation && (
                                                <div className="mt-auto bg-white/60 text-gray-700 text-[14px] font-medium leading-relaxed border border-gray-100 rounded-xl p-5 shadow-sm inline-block w-full">
                                                    <span className="text-purple-600 font-bold mr-2 text-xs uppercase tracking-wider">Insight:</span>
                                                    {chartItem.explanation}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full xl:col-span-2 border border-white bg-white/70 backdrop-blur-2xl rounded-[24px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-6 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-100/80">
                                        <h3 className="font-semibold text-gray-800 tracking-tight flex items-center gap-2 text-xl">
                                            <span className="w-3 h-3 rounded-full shadow-sm bg-purple-500" />
                                            Primary Analysis
                                        </h3>
                                    </div>
                                    <div className="w-full h-[550px] relative">
                                        <ErrorBoundary>
                                            <ChartDisplay chartData={activeChartData} />
                                        </ErrorBoundary>
                                    </div>
                                    {activeChartData.explanation && (
                                        <div className="mt-auto bg-white/60 text-gray-700 text-[15px] font-medium leading-relaxed border border-gray-100 rounded-xl p-6 shadow-sm inline-block w-full">
                                            <span className="text-purple-600 font-bold mr-2 text-xs uppercase tracking-wider">Insight:</span>
                                            {activeChartData.explanation}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 relative z-10 space-y-6 pt-20">
                            <div className="bg-white/80 p-8 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white">
                                <BarChart2 className="w-16 h-16 text-purple-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-700 tracking-tight">Workspace Empty</h2>
                            <p className="text-gray-500 max-w-sm text-center leading-relaxed">
                                Ask the <span className="font-semibold text-purple-600">AI Analyst</span> on the left to generate insights, and they will appear perfectly formatted on this main stage.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}