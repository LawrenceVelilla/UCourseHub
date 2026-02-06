import express from "express";
import { db } from "../config/db/index.js";
import { professors } from "../config/db/professors.js";
import { eq } from "drizzle-orm";
import { fetchDependents, fetchCourse, fetchProfessorsByCourseId } from "../controllers/course-controller.js";
import { fetchDiscussionsByCourseId } from "../controllers/reddit-controller.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const department = req.query.department as string;

    if (!department) {
        return res.status(400).json({ error: "Department parameter is required" });
    }

    try {
        const profs = await db.select().from(professors).where(eq(professors.department, department));
        res.json(profs);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: "Failed to fetch professors" });
    }
});

router.get("/course", async (req, res) => {
    const courseCode = req.query.courseCode as string;

    if (!courseCode) {
        return res.status(400).json({ error: "Course code parameter is required" });
    }

    try {
        const course = await fetchCourse(courseCode);
        res.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ error: "Failed to fetch course" });
    }
});

router.get("/dependents", async (req, res) => {
    const courseCode = req.query.courseCode as string;

    if (!courseCode) {
        return res.status(400).json({ error: "Course code parameter is required" });
    }

    try {
        const dependents = await fetchDependents(courseCode);
        res.json(dependents);
    } catch (error) {
        console.error("Error fetching dependents:", error);
        res.status(500).json({ error: "Failed to fetch dependents" });
    }
});

router.get("/reddit/discussions", fetchDiscussionsByCourseId);

router.get("/professors", async (req, res) => {
    const courseId = req.query.courseId as string;

    if (!courseId) {
        return res.status(400).json({ error: "courseId parameter is required" });
    }

    try {
        const profs = await fetchProfessorsByCourseId(courseId);
        res.json(profs);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: "Failed to fetch professors" });
    }
});

export default router;
