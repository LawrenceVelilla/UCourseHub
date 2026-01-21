import { Request, Response } from "express";
import { getDiscussionsByCourseId } from "../services/reddit-service";

export async function fetchDiscussionsByCourseId(req: Request, res: Response) {
    const courseId = req.query.courseId as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!courseId) {
        return res.status(400).json({ error: "courseId parameter is required" });
    }

    try {
        const discussions = await getDiscussionsByCourseId(courseId, limit);
        res.json(discussions);
    } catch (error) {
        console.error("Error fetching Reddit discussions:", error);
        res.status(500).json({ error: "Failed to fetch discussions" });
    }
}
