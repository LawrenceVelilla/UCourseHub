import { Request, Response } from "express";
import { db } from "../config/db/index.js";
import { plans, planCourses } from "../config/db/plans.js";
import { eq, and, sql } from "drizzle-orm";

export async function getPlans(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const result = await db
            .select({
                id: plans.id,
                name: plans.name,
                createdAt: plans.createdAt,
                updatedAt: plans.updatedAt,
                courseCount: sql<number>`(SELECT COUNT(*) FROM plan_courses WHERE plan_id = ${plans.id})::int`,
            })
            .from(plans)
            .where(eq(plans.userId, userId))
            .orderBy(plans.updatedAt);

        res.json(result);
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).json({ error: "Failed to fetch plans" });
    }
}

export async function getPlan(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const planId = req.params.id as string;
    if (!planId) return res.status(400).json({ error: "Plan ID is required" });

    try {
        const [plan] = await db
            .select()
            .from(plans)
            .where(and(eq(plans.id, planId), eq(plans.userId, userId)));

        if (!plan) return res.status(404).json({ error: "Plan not found" });

        const courses = await db
            .select({
                courseCode: planCourses.courseCode,
                year: planCourses.year,
                term: planCourses.term,
            })
            .from(planCourses)
            .where(eq(planCourses.planId, planId));

        res.json({ ...plan, courses });
    } catch (error) {
        console.error("Error fetching plan:", error);
        res.status(500).json({ error: "Failed to fetch plan" });
    }
}

export async function createPlan(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name } = req.body;
    if (!name || typeof name !== "string" || name.length > 100) {
        return res.status(400).json({ error: "Valid plan name is required (max 100 chars)" });
    }

    try {
        const [plan] = await db
            .insert(plans)
            .values({ userId, name: name.trim() })
            .returning();

        res.status(201).json(plan);
    } catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ error: "Failed to create plan" });
    }
}

export async function updatePlan(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const planId = req.params.id as string;
    const { name, courses } = req.body;

    try {
        // Verify ownership
        const [plan] = await db
            .select()
            .from(plans)
            .where(and(eq(plans.id, planId), eq(plans.userId, userId)));

        if (!plan) return res.status(404).json({ error: "Plan not found" });

        // Update name if provided
        if (name && typeof name === "string" && name.length <= 100) {
            await db
                .update(plans)
                .set({ name: name.trim(), updatedAt: new Date() })
                .where(eq(plans.id, planId));
        }

        // Replace courses if provided
        if (Array.isArray(courses)) {
            await db.delete(planCourses).where(eq(planCourses.planId, planId));

            if (courses.length > 0) {
                const rows = courses.map((c: { courseCode: string; year: number; term: string }) => ({
                    planId,
                    courseCode: c.courseCode,
                    year: c.year,
                    term: c.term,
                }));
                await db.insert(planCourses).values(rows);
            }

            await db
                .update(plans)
                .set({ updatedAt: new Date() })
                .where(eq(plans.id, planId));
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ error: "Failed to update plan" });
    }
}

export async function deletePlan(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const planId = req.params.id as string;

    try {
        const result = await db
            .delete(plans)
            .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
            .returning();

        if (result.length === 0) return res.status(404).json({ error: "Plan not found" });

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ error: "Failed to delete plan" });
    }
}
