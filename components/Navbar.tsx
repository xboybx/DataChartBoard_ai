"use client";

import { BarChart3, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-30 w-full bg-white/40 backdrop-blur-xl border-b border-white/60 px-6 py-3 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
                <div className="bg-gray-900 p-1.5 rounded-lg shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-gray-900 leading-none">AI Data Analyzer</h1>
                    <div className="flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Secure Environment</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button className="p-2 rounded-full bg-white/60 border border-white hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900">
                        <Info className="w-5 h-5" />
                    </button>
                    
                    {/* Tooltip content */}
                    <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 text-left">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Pro Tips for Analysis
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs leading-relaxed text-gray-600">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</span>
                                <p>If the AI does not generate any charts initially, please try clicking <strong>Retry</strong> or rephrasing your request.</p>
                            </li>
                            <li className="flex gap-3 text-xs leading-relaxed text-gray-600">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">2</span>
                                <p>If you see data but no charts, specifically ask the AI to <strong>"Visualize this data in a chart"</strong> for better results.</p>
                            </li>
                        </ul>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400 italic">
                            🚀 Press Enter to send your message
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
