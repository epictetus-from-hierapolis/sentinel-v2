import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => new PrismaClient();

// Prevent multiple instances of Prisma Client in development (Hot Reload safety)
declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;