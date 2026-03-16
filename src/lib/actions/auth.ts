"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

/**
 * AUTHENTICATION SERVER ACTION
 * Triggered from the Login Form to process user credentials.
 */
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        // AuthError.type === "callbackRouteError" or others should be thrown to be caught by Next.js
        throw error;
    }
}
