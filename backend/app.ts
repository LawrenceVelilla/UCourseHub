import express from "express";
import cors from "cors";
import rmpRouter from "./routes/rmp-routes";
import scraperRouter from "./routes/scraper-routes";
import dbRouter from "./routes/db-routes";
import dotenv from "dotenv";

const app = express();

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/admin/rmp", rmpRouter);
app.use("/api/admin/scraper", scraperRouter);
app.use("/api", dbRouter);

// Checking if its up
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
