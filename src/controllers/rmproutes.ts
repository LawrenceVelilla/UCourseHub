import express from "express";
import { getProfessor } from "../services/rmpservice";

const router = express.Router();

router.get("/", async (req, res) => {
    res.send("Hello World!");
});


router.post("/admin", async (req, res) => {
    try {
        const { schoolId, department, departmentId, save = "false" } = req.query;

        console.log("Query params:", { schoolId, department, departmentId, save });

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: schoolId"
            });
        }

        const professors = await getProfessor(
            schoolId as string,
            department as string || "",
            departmentId as string || ""
        );

        const shouldSave = save === "true";
        let saved = 0;

        if (shouldSave) {
            // Save the professor data to db which I'll do later
        }

        res.json({ success: true, scraped: professors.length, saved, professors });
    } catch (error: unknown) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
});

export default router;