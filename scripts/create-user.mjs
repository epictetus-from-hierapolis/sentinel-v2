// ADMIN USER CREATION SCRIPT
// Use this to bootstrap your environment with an initial admin account.
// Usage: node --env-file=.env scripts/create-user.mjs

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SENTINEL_ADMIN_EMAIL;
    const password = process.env.SENTINEL_ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("❌ Error: SENTINEL_ADMIN_EMAIL and SENTINEL_ADMIN_PASSWORD must be set in your .env file.");
        process.exit(1);
    }

    const name = "System Administrator";
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        console.log(`⏳ Attempting to create/update user: ${email}...`);

        await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name,
            },
            create: {
                email,
                password: hashedPassword,
                name,
            },
        });

        console.log(`✅ Success! User [${email}] has been created/updated.`);
    } catch (error) {
        console.error("❌ Critical Error during user creation:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
