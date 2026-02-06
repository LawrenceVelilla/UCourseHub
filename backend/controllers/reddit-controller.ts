import { Request, Response } from "express";
import { db } from "../config/db/index.js";
import { redditPosts, redditPostCourses } from "../config/db/reddit.js";
import { eq, sql } from "drizzle-orm";

export async function fetchDiscussionsByCourseId(req: Request, res: Response) {
    const courseId = req.query.courseId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!courseId) {
        return res.status(400).json({ error: "courseId parameter is required" });
    }

    try {
        const postIds = await db
            .select({ postId: redditPostCourses.postId })
            .from(redditPostCourses)
            .where(eq(redditPostCourses.courseId, courseId));

        if (postIds.length === 0) {
            return res.json({ discussions: [], hasMore: false });
        }

        const ids = postIds.map(p => p.postId);

        const discussions = await db
            .select({
                id: redditPosts.id,
                title: redditPosts.title,
                preview: redditPosts.selftext,
                url: redditPosts.url,
                upvotes: redditPosts.score,
                comments: redditPosts.numComments,
                createdAt: redditPosts.createdUtc,
            })
            .from(redditPosts)
            .where(sql`${redditPosts.id} IN ${ids}`)
            .orderBy(sql`${redditPosts.score} DESC`)
            .limit(limit + 1)
            .offset(offset);

        const hasMore = discussions.length > limit;
        const result = hasMore ? discussions.slice(0, limit) : discussions;

        res.json({
            discussions: result.map(d => ({
                ...d,
                preview: d.preview ? d.preview.substring(0, 200) + (d.preview.length > 200 ? '...' : '') : '',
            })),
            hasMore,
        });
    } catch (error) {
        console.error("Error fetching Reddit discussions:", error);
        res.status(500).json({ error: "Failed to fetch discussions" });
    }
}
