import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const geist = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "DataProcessor — AI Data Analysis",
    description: "Upload your CSV and chat with AI to get instant insights and charts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${geist.variable} h-full`}>
            <body className="h-full bg-[#f1eef1] text-gray-900 antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}