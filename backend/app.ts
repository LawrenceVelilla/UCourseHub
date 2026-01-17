import express from "express";
import rmpRouter from "./routes/rmp-routes";
import { pool } from "./config/db/index";
import dotenv from "dotenv";
import type { Request, Response } from "express";

const app = express();

dotenv.config();

const requestHandler = async (req: Request, res: Response) => {
    const result = await pool.query("SELECT version()");
    const { version } = result.rows[0];
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(version);
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/admin/rmp", rmpRouter);

// Checking if its up
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
