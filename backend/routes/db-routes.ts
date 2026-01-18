import express from "express";
import { getDepartmentProfessors } from "../scrapers/prof-catalogue";

const router = express.Router();

router.get("/", async (req, res) => {
    const department = req.query.department as string;

    if (!department) {
        return res.status(400).json({ error: "Department parameter is required" });
    }

    try {
        const professors = await getDepartmentProfessors(department);
        res.json(professors);
    } catch (error) {
        console.error("Error fetching professors:", error);
        res.status(500).json({ error: "Failed to fetch professors" });
    }
});

export default router;