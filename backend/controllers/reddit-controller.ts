import { Request, Response } from "express";
import { getDiscussionsByCourseId } from "../services/reddit-service.js";

export async function fetchDiscussionsByCourseId(req: Request, res: Response) {
    const courseId = req.query.courseId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!courseId) {
        return res.status(400).json({ error: "courseId parameter is required" });
    }

    try {
        const result = await getDiscussionsByCourseId(courseId, limit, offset);
        res.json(result);
    } catch (error) {
        console.error("Error fetching Reddit discussions:", error);
        res.status(500).json({ error: "Failed to fetch discussions" });
    }
}
