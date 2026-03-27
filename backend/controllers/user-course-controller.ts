import { Request, Response } from "express";
import { db } from "../config/db/index.js";
import { userCourses } from "../config/db/user-courses.js";
import { eq, and } from "drizzle-orm";

export async function getUserCourses(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const courses = await db
            .select()
            .from(userCourses)
            .where(eq(userCourses.userId, userId))
            .orderBy(userCourses.year, userCourses.term);

        res.json(courses);
    } catch (error) {
        console.error("Error fetching user courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
}

export async function addUserCourse(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { courseCode, term, year, grade } = req.body;

    if (!courseCode || typeof courseCode !== "string" || courseCode.length > 20) {
        return res.status(400).json({ error: "Valid course code is required" });
    }
    if (!term || !["fall", "winter", "spring"].includes(term)) {
        return res.status(400).json({ error: "Valid term is required (fall, winter, spring)" });
    }
    if (!year || typeof year !== "number" || year < 2000 || year > 2100) {
        return res.status(400).json({ error: "Valid year is required" });
    }

    try {
        const [course] = await db
            .insert(userCourses)
            .values({
                userId,
                courseCode: courseCode.toUpperCase().trim(),
                term,
                year,
                grade: grade || null,
            })
            .onConflictDoUpdate({
                target: [userCourses.userId, userCourses.courseCode],
                set: { term, year, grade: grade || null },
            })
            .returning();

        res.status(201).json(course);
    } catch (error) {
        console.error("Error adding user course:", error);
        res.status(500).json({ error: "Failed to add course" });
    }
}

export async function deleteUserCourse(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const courseCode = req.params.courseCode as string;
    if (!courseCode) return res.status(400).json({ error: "Course code is required" });

    try {
        const result = await db
            .delete(userCourses)
            .where(and(
                eq(userCourses.userId, userId),
                eq(userCourses.courseCode, courseCode.toUpperCase().trim()),
            ))
            .returning();

        if (result.length === 0) return res.status(404).json({ error: "Course not found" });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting user course:", error);
        res.status(500).json({ error: "Failed to delete course" });
    }
}
