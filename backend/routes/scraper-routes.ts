import { Router } from "express";
import { filterByDepartment } from "../scrapers/prof-catalogue";
import { scrapeAndSaveDepartmentCourses } from "../services/course-service";

const router = Router();

router.get("/prof-scraper", async (req, res) => {
    const department = req.query.department as string;

    if (!department) {
        return res.status(400).json({ error: "Department parameter is required" });
    }

    try {
        await filterByDepartment(department);
        res.json({ message: "Success", department });
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

export default router;
