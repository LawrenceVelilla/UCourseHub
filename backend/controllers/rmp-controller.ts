import type { Request, Response } from "express";
import * as rmpService from "../services/rmp-service";

export async function healthCheck(req: Request, res: Response) {
    res.send("RMP API is running");
}


// Change from req.query to req.body when we have the pages setup with the form
// For now its easier for me to just use postman and pass the parameters as a query string
//  for the intial scraping
export async function fetchProfessors(req: Request, res: Response) {
    try {
        // Set Connection: close to ensure curl exits properly
        res.setHeader('Connection', 'close');

        const { schoolId, department, departmentId, save = "false" } = req.query;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: schoolId"
            });
        }

        const professors = await rmpService.getProfessor(
            schoolId as string,
            department as string || "",
            departmentId as string || ""
        );

        const shouldSave = save === "true";
        let saved = 0;

        if (shouldSave) {
            saved = await rmpService.bulkSaveProfessors(professors);
        }

        return res.json({
            success: true,
            scraped: professors.length,
            saved,
            professors
        });
    } catch (error: unknown) {
        console.error("Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}
