import express from "express";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import courseRouter from "./routes/course-routes.js";
import planRouter from "./routes/plan-routes.js";
import userCourseRouter from "./routes/user-course-routes.js";
import rateLimit from "express-rate-limit";
import { auth } from "./lib/auth.js";
import { allowedOrigins } from "./config/allowed-origins.js";

const app = express();

// Behind Cloudflare/Render proxy — trust first proxy so req.ip is the real client IP
app.set("trust proxy", 1);

// Per-route rate limiters instead of one global limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: "Too many requests, please try again later." }),
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => res.status(429).json({ error: "Too many attempts, please try again later." }),
});

app.use(helmet());

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

app.use("/api/v1/courses", apiLimiter, courseRouter);
app.use("/api/v1/plans", apiLimiter, planRouter);
app.use("/api/v1/user/courses", apiLimiter, userCourseRouter);

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "UCourseHub API is running" });
});

export default app;
