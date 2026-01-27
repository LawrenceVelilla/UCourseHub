import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as professors from "./professors.js";
import * as courses from "./courses.js";
import * as professorCourses from "./professor_courses.js";
import * as reddit from "./reddit.js";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

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
