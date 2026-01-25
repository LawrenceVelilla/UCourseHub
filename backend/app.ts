import express from "express";
import cors from "cors";
import rmpRouter from "./routes/rmp-routes.js";
import scraperRouter from "./routes/scraper-routes.js";
import dbRouter from "./routes/db-routes.js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";


const app = express();

dotenv.config();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL1,
    process.env.FRONTEND_URL2
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

app.use("/api/admin/rmp", rmpRouter);
app.use("/api/admin/scraper", scraperRouter);
app.use("/api", dbRouter);

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
