import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);
export { auth as proxy };

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ["/((?!api|_next/static|_next/image|manifest\\.json|sw\\.js|.*\\.png$|.*\\.jpg$|.*\\.mp4$|.*\\.svg$|.*\\.ico$).*)"],
};
