import { betterAuth } from "better-auth";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL1,
    process.env.FRONTEND_URL2,
    process.env.FRONTEND_URL3,
    process.env.FRONTEND_URL4,
].filter(Boolean) as string[];

export const auth = betterAuth({
    database: {
        url: process.env.DATABASE_URL!,
        type: "postgres",
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: allowedOrigins,
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
});
