"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push("/login");
            } else {
                const data = await res.json();
                setError(data.error || "Something went wrong");
            }
        } catch (err) {
            setError("Failed to connect to the server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-4">
            <div className="w-full max-w-sm space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-black">Create account</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Sign up to start analyzing your data.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm text-black placeholder-gray-400 outline-none focus:border-black"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm text-black placeholder-gray-400 outline-none focus:border-black"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm text-black placeholder-gray-400 outline-none focus:border-black"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-black underline underline-offset-4">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
