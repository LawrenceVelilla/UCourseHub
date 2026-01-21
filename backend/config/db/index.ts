import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as professors from "./professors";
import * as courses from "./courses";
import * as professorCourses from "./professor_courses";
import * as reddit from "./reddit";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle pool errors to prevent app crash on unexpected disconnections
pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, {
    schema: {
        ...professors,
        ...courses,
        ...professorCourses,
        ...reddit,
    },
});

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};
