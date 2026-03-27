import express from "express";
import { fetchCourseList, fetchDependents, fetchCourse, fetchProfessorsByCourseId } from "../controllers/course-controller.js";
import { fetchDiscussionsByCourseId } from "../controllers/reddit-controller.js";

const router = express.Router();

router.get("/", async (_req, res) => {
    try {
        const courseList = await fetchCourseList();
        res.json(courseList);
    } catch (error) {
        console.error("Error fetching course list:", error);
        res.status(500).json({ error: "Failed to fetch course list" });
    }
});

router.get("/:courseCode", async (req, res) => {
    const courseCode = req.params.courseCode as string;

    if (!courseCode || courseCode.length > 20) {
        return res.status(400).json({ error: "Valid course code parameter is required" });
    }

    try {
        const course = await fetchCourse(courseCode);
        res.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ error: "Failed to fetch course" });
    }
});

router.get("/:courseCode/dependents", async (req, res) => {
    const courseCode = req.params.courseCode as string;

    if (!courseCode || courseCode.length > 20) {
        return res.status(400).json({ error: "Valid course code parameter is required" });
    }

    try {
        const dependents = await fetchDependents(courseCode);
        res.json(dependents);
    } catch (error) {
        console.error("Error fetching dependents:", error);
        res.status(500).json({ error: "Failed to fetch dependents" });
    }
});

router.get("/:courseId/professors", async (req, res) => {
    const courseId = req.params.courseId as string;

    if (!courseId || courseId.length > 200) {
        return res.status(400).json({ error: "Valid courseId parameter is required" });
    }

    try {
        const profs = await fetchProfessorsByCourseId(courseId);
        res.json(profs);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: "Failed to fetch professors" });
    }
});

router.get("/:courseId/discussions", fetchDiscussionsByCourseId);

export default router;
