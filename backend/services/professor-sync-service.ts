/**
 * Unified Professor Sync Service
 *
 * Combines RMP scraping + UAlberta scraping + matching + saving in one pipeline
 *
 * Workflow:
 * 1. Scrape RMP for department → get all professors with ratings
 * 2. Save RMP professors to DB
 * 3. Scrape UAlberta directory for department → get professors + courses
 * 4. Match UAlberta professors to RMP data (now in DB)
 * 5. Create new professors for those not in RMP
 * 6. Link all professors to their courses
 */

import { getProfessor, bulkSaveProfessors } from "./rmp-service";
import { fetchProfessors } from "../scrapers/prof-catalogue";
import { syncProfessorsToCourses } from "./professor-course-service";
import { normalizeDepartment } from "../utils/professor-utils";

interface FullSyncSummary {
    department: string;
    rmpScraped: number;
    rmpSaved: number;
    ualbertaScraped: number;
    matchedToRMP: number;
    newProfessors: number;
    coursesLinked: number;
    coursesFailed: number;
    errors: string[];
}

/**
 * Full sync pipeline for a department
 *
 * @param ualbertaDepartment - Department name as it appears in UAlberta directory 
 * @param schoolId - RMP school ID (defaults to UAlberta)
 * @param rmpDepartmentId - Optional RMP department ID for filtering
 */
export async function fullProfessorSync(ualbertaDepartment: string, schoolId: string = "U2Nob29sLTE0MDc=", rmpDepartmentId: string = ""): Promise<FullSyncSummary> {

    const summary: FullSyncSummary = {
        department: ualbertaDepartment,
        rmpScraped: 0,
        rmpSaved: 0,
        ualbertaScraped: 0,
        matchedToRMP: 0,
        newProfessors: 0,
        coursesLinked: 0,
        coursesFailed: 0,
        errors: []
    };

    try {
        const rmpDepartment = normalizeDepartment(ualbertaDepartment);
        console.log(`\n=== Starting Full Professor Sync for ${ualbertaDepartment} ===`);
        console.log(`RMP department: ${rmpDepartment}`);

        const rmpProfessors = await getProfessor(schoolId, rmpDepartment, rmpDepartmentId);
        summary.rmpScraped = rmpProfessors.length;

        const rmpSaved = await bulkSaveProfessors(rmpProfessors);
        summary.rmpSaved = rmpSaved;

        const ualbertaProfessors = await fetchProfessors(ualbertaDepartment);
        summary.ualbertaScraped = ualbertaProfessors.length;


        if (ualbertaProfessors.length === 0) {
            console.log('⚠ No professors found in UAlberta directory');
            return summary;
        }

        const syncResult = await syncProfessorsToCourses(ualbertaProfessors, ualbertaDepartment);

        summary.matchedToRMP = syncResult.matched;
        summary.newProfessors = syncResult.newProfessors;
        summary.coursesLinked = syncResult.coursesLinked;
        summary.coursesFailed = syncResult.coursesFailed;
        summary.errors = syncResult.errors;

        return summary;

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        summary.errors.push(`Fatal error: ${errorMsg}`);
        throw error;
    }
}
