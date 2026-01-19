import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import * as professors from "./professors";
import * as courses from "./courses";
import * as professorCourses from "./professor_courses";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
    schema: {
        ...professors,
        ...courses,
        ...professorCourses,
    },
});

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};
