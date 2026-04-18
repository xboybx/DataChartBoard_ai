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
    const [chatWidth, setChatWidth] = useState(50); // Default 50% split
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
            alert("Failed to get response.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="flex h-full w-full items-center justify-center text-gray-500">Loading conversation...</div>;
    }

    return (
        <div ref={containerRef} className="flex w-full h-full bg-transparent relative overflow-hidden">
            <div
                className={clsx(
                    "flex flex-col h-full bg-transparent  relative z-10",
                    isDragging && "transition-none cursor-col-resize"
                )}
                style={{ width: activeChartData ? `${chatWidth}%` : '100%' }}
            >
                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
                    <div className="max-w-3xl mx-auto w-full space-y-8">
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

                                        {msg.chartData && (
                                            <button
                                                onClick={() => setActiveChartData(msg.chartData)}
                                                className="mt-4 flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all font-medium text-xs tracking-wide"
                                            >
                                                <BarChart2 className="w-4 h-4 text-purple-500" />
                                                View Interactive Chart
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

                <div className="p-4">
                    <div className="max-w-3xl mx-auto w-full relative">
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
                                placeholder="Ask a question about your data..."
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
                        <div className="text-center text-xs text-gray-600 mt-3">
                            AI can make mistakes. Always verify important data insights.
                        </div>
                    </div>
                </div>
            </div>

            {activeChartData && (
                <div
                    onMouseDown={() => setIsDragging(true)}
                    className="absolute top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-purple-300/50 transition-colors z-40 active:bg-purple-400"
                    style={{ left: `calc(${chatWidth}% - 3px)` }}
                />
            )}

            <div
                className={clsx(
                    "h-full border-l border-white/50 bg-white/20 backdrop-blur-3xl flex flex-col absolute right-0 top-0 shadow-[-20px_0_40px_rgba(0,0,0,0.03)] z-30",
                    activeChartData ? "translate-x-0" : "translate-x-full"
                )}
                style={{ width: activeChartData ? `${100 - chatWidth}%` : '50%' }}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/60 bg-transparent">
                    <div className="flex items-center gap-3 font-semibold text-gray-800 tracking-wide">
                        <BarChart2 className="w-5 h-5 text-purple-500" />
                        Data Visualization
                    </div>
                    <button
                        onClick={() => setActiveChartData(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100/80 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-start overflow-y-auto w-full">
                    {activeChartData ? (
                        <div className="w-full flex flex-col gap-10">
                            <ErrorBoundary>
                                {Array.isArray(activeChartData) ? (
                                    activeChartData.map((chartItem, idx) => (
                                        <div key={idx} className="w-full h-[400px] shrink-0 border border-white/60 bg-white/30 backdrop-blur-2xl rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                            <ChartDisplay chartData={chartItem} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-[450px]">
                                        <ChartDisplay chartData={activeChartData} />
                                    </div>
                                )}
                            </ErrorBoundary>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center text-sm my-auto">
                            Select a chart from the conversation to view it here.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}