import { Router } from "express";
import { filterByDepartment, getProfessors, getProfessorInfo } from "../scrapers/prof-catalogue";
import { scrapeAndSaveDepartmentCourses } from "../services/course-service";
import { fetchProfessors } from "../scrapers/prof-catalogue";



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

router.get("/prof-scraper/test", async (req, res) => {
    try {

        const department = req.query.department as string;
        const pageSource = await filterByDepartment(department);
        const profs = await getProfessors(pageSource);
        res.json({ message: "Success", profs });
    } catch (error) {
        console.error("Error scraping professors:", error);
        res.status(500).json({ error: "Failed to scrape professors" });
    }
});

// Test route for getProfessorInfo - e.g. /prof-info?url=/directory/person/ababzade
router.get("/prof-info", async (req, res) => {
    const url = req.query.url as string;

    if (!url) {
        return res.status(400).json({ error: "url parameter is required (e.g. /directory/person/ababzade)" });
    }

    try {
        const profInfo = await getProfessorInfo(url);
        res.json({ message: "Success", profInfo });
    } catch (error) {
        console.error("Error getting professor info:", error);
        res.status(500).json({ error: "Failed to get professor info" });
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
