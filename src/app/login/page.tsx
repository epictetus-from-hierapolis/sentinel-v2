"use client";

import { useState } from "react";
import { useActionState } from "react";
import { authenticate } from "@/lib/actions/auth";

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative">
                {/* LOGO AREA */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-slate-900 border-2 border-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="relative z-10"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
                        Sentinel <span className="text-blue-500">v2</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide">
                        SECURITY EVENT HUB
                    </p>
                </div>

                {/* LOGIN FORM */}
                <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                    <form action={formAction} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                required
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                            />
                        </div>

                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-3 animate-shake">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {errorMessage}
                            </div>
                        )}

                        <button
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-wait text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Access Hub"
                            )}
                        </button>
                    </form>
                </div>

                {/* FOOTER INFO */}
                <p className="text-center mt-10 text-[10px] font-mono text-slate-700 uppercase tracking-[0.3em]">
                    Restricted Access &bull; AES-256 Protected
                </p>
            </div>
        </div>
    );
}
