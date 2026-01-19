import { Router } from "express";
import { scrapeAndSaveDepartmentCourses } from "../services/course-service";
import { fetchProfessors } from "../scrapers/prof-catalogue";
import { fetchPosts } from "../scrapers/reddit";
import { syncProfessorsToCourses } from "../services/professor-course-service";
import { fullProfessorSync } from "../services/professor-sync-service";
import { scrapeRedditForDepartment, scrapeRedditForCourse } from "../services/reddit-service";

const router = Router();

router.get("/prof-scraper", async (req, res) => {
    try {
        const department = req.query.department as string;

        if (!department) {
            return res.status(400).json({ error: "Department parameter is required (e.g. ?department=Computer Science)" });
        }

        const profs = await fetchProfessors(department);
        res.json({ message: "Success", profs });
    } catch (error) {
        console.error("Error scraping professors:", error);
        res.status(500).json({ error: "Failed to scrape professors" });
    }
});

router.get("/course-scraper", async (req, res) => {
    const department = req.query.department as string;
    const from = req.query.from ? Number(req.query.from) : 0;
    const to = req.query.to ? Number(req.query.to) : -1;

    if (!department) {
        return res.status(400).json({ error: "Department parameter is required" });
    }

    try {
        const savedCount = await scrapeAndSaveDepartmentCourses(department, from, to);
        res.json({
            message: "Success",
            department,
            coursesScraped: savedCount
        });
    } catch (error) {
        console.error("Error scraping courses:", error);
        res.status(500).json({ error: "Failed to scrape courses" });
    }
});


router.get("/reddit-scraper", async (req, res) => {
    const courseCode = req.query.courseCode as string;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!courseCode) {
        return res.status(400).json({ error: "Course code parameter is required" });
    }

    try {
        const posts = await fetchPosts(courseCode, limit);
        res.json({ message: "Success", posts });
    } catch (error) {
        console.error("Error scraping posts:", error);
        res.status(500).json({ error: "Failed to scrape posts" });
    }
});

// Already have RMP data, just need to link professors to courses
router.post("/professor-sync", async (req, res) => {
    try {
        const department = req.query.department as string;

        if (!department) {
            return res.status(400).json({
                error: "Department parameter is required (e.g. ?department=Computing Science)"
            });
        }

        const scrapedProfs = await fetchProfessors(department);
        console.log(`Scraped ${scrapedProfs.length} professors`);

        if (scrapedProfs.length === 0) {
            return res.json({
                success: true,
                message: "No professors found for this department",
                summary: {
                    totalScraped: 0,
                    matched: 0,
                    newProfessors: 0,
                    coursesLinked: 0,
                    coursesFailed: 0,
                    errors: []
                }
            });
        }

        const summary = await syncProfessorsToCourses(scrapedProfs, department);

        res.json({
            success: true,
            message: `Synced ${summary.totalScraped} professors for ${department}`,
            summary
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

router.post("/professor-full-sync", async (req, res) => {
    try {
        const department = req.query.department as string;
        const schoolId = req.query.schoolId as string | undefined;
        const rmpDepartmentId = req.query.rmpDepartmentId as string | undefined;

        if (!department) {
            return res.status(400).json({
                error: "Department parameter is required (e.g. ?department=Computing Science)"
            });
        }

        const summary = await fullProfessorSync(department, schoolId, rmpDepartmentId);

        res.json({ success: true, message: `Full sync completed for ${department}`, summary });

    } catch (error) {
        console.error("Error in full professor sync:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

router.post("/reddit/department", async (req, res) => {
    try {
        const department = req.query.department as string;

        if (!department) {
            return res.status(400).json({
                error: "Department parameter is required (e.g. ?department=CMPUT)"
            });
        }

        const result = await scrapeRedditForDepartment(department);

        res.json({
            success: true,
            message: `Scraped Reddit for ${department}`,
            result
        });

    } catch (error) {
        console.error("Error scraping Reddit for department:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
});

router.post("/reddit/course", async (req, res) => {
    try {
        const courseCode = req.query.courseCode as string;
        const maxPages = req.query.maxPages ? Number(req.query.maxPages) : 2;

        if (!courseCode) {
            return res.status(400).json({
                error: "courseCode parameter is required (e.g. ?courseCode=CMPUT 174)"
            });
        }

        const result = await scrapeRedditForCourse(courseCode, maxPages);

        res.json({
            success: true,
            message: `Scraped Reddit for ${courseCode}`,
            result
        });

    } catch (error) {
        console.error("Error scraping Reddit for course:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
});


export default router;
