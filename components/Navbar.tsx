"use client";

import { BarChart3, ShieldCheck } from "lucide-react";
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
                <div className="hidden sm:flex items-center px-3 py-1 bg-white/60 border border-white rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                    <span className="text-xs font-medium text-gray-500">System Active</span>
                </div>
            </div>
        </nav>
    );
}
