import express from "express";
import rmpRouter from "./routes/rmp-routes";
import scraperRouter from "./routes/scraper-routes";
import dbRouter from "./routes/db-routes";
import dotenv from "dotenv";

const app = express();

dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/admin/rmp", rmpRouter);
app.use("/admin/scraper", scraperRouter);
app.use("/admin/db", dbRouter);

// Checking if its up
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
