import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/server/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

// Child logger scoped to the authentication module
const log = logger.child({ module: 'auth' });

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            async authorize(credentials, request) {
                // --- RATE LIMITING ---
                // Extract the client IP from the request headers.
                // X-Forwarded-For is set by Nginx / reverse proxies; fall back to a safe default.
                const ip =
                    request?.headers?.get('x-forwarded-for')?.split(',')[0].trim() ??
                    request?.headers?.get('x-real-ip') ??
                    '127.0.0.1';

                // Allow a maximum of 5 login attempts per IP per minute.
                // This prevents brute-force attacks on the login form.
                const { allowed, remaining, resetAt } = checkRateLimit(ip, {
                    limit: 5,
                    windowMs: 60_000, // 1 minute window
                });

                if (!allowed) {
                    const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
                    log.warn({ ip, retryAfterSec }, 'Login rate limit exceeded');
                    // Returning null causes NextAuth to show an "Invalid credentials" error.
                    // The client will be blocked silently — no information leakage.
                    return null;
                }

                log.debug({ ip, remaining }, 'Login attempt allowed');

                // --- CREDENTIAL VALIDATION ---
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await prisma.user.findFirst({ where: { email } });

                    // Return null early if user doesn't exist (same response as wrong password
                    // to prevent user enumeration attacks)
                    if (!user) {
                        log.warn({ ip, email }, 'Login failed: user not found');
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        log.info({ ip, email }, 'Login successful');
                        return user;
                    }
                }

                log.warn({ ip }, 'Login failed: invalid credentials');
                return null;
            },
        }),
    ],
});
