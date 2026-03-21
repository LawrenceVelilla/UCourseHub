import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import dbRouter from "./routes/db-routes.js";
import planRouter from "./routes/plan-routes.js";
import userCourseRouter from "./routes/user-course-routes.js";
import rateLimit from "express-rate-limit";
import { auth } from "./lib/auth.js";
import { allowedOrigins } from "./config/allowed-origins.js";

const app = express();
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
});

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

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth));

app.use("/api", dbRouter);
app.use("/api/plans", planRouter);
app.use("/api/user/courses", userCourseRouter);

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
