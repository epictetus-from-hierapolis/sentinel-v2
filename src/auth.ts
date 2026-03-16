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
                try {
                    log.debug('Authorize callback started');
                    // --- RATE LIMITING ---
                    const ip =
                        request?.headers?.get('x-forwarded-for')?.split(',')[0].trim() ??
                        request?.headers?.get('x-real-ip') ??
                        '127.0.0.1';

                    const { allowed, remaining, resetAt } = checkRateLimit(ip, {
                        limit: 5,
                        windowMs: 60_000,
                    });

                    if (!allowed) {
                        const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
                        log.warn({ ip, retryAfterSec }, 'Login rate limit exceeded');
                        return null;
                    }

                    // --- CREDENTIAL VALIDATION ---
                    const parsedCredentials = z
                        .object({ email: z.string().email(), password: z.string().min(6) })
                        .safeParse(credentials);

                    if (parsedCredentials.success) {
                        const { email, password } = parsedCredentials.data;
                        log.debug({ email }, 'Looking up user in DB');
                        const user = await prisma.user.findFirst({ where: { email } });

                        if (!user) {
                            log.warn({ ip, email }, 'Login failed: user not found');
                            return null;
                        }

                        log.debug({ email }, 'Comparing passwords');
                        const passwordsMatch = await bcrypt.compare(password, user.password);

                        if (passwordsMatch) {
                            log.info({ ip, email }, 'Login successful');
                            return user;
                        }
                    }

                    log.warn({ ip }, 'Login failed: invalid credentials');
                    return null;
                } catch (err) {
                    log.error({ err }, 'EXCEPTIONAL ERROR in authorize callback');
                    throw err;
                }
            },
        }),
    ],
});
