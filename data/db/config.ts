import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import { Pinecone } from '@pinecone-database/pinecone';
import { courses } from "./courses.js";
import { professors } from "./professors.js";
import { professorCourses } from "./professor_courses.js";
import * as reddit from "./reddit.js";

dotenv.config();

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
});


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



