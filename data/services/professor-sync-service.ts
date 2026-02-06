import { getProfessor, bulkSaveProfessors } from "./rmp-service.js";
import { fetchProfessors } from "../scrapers/prof-catalogue.js";
import { syncProfessorsToCourses } from "./professor-course-service.js";
import { normalizeDepartment } from "../utils/professor-utils.js";
import { FullSyncSummary } from "./types.js";

export async function fullProfessorSync(
    ualbertaDepartment: string,
    schoolId: string = "U2Nob29sLTE0MDc=",
    rmpDepartmentId: string = ""
): Promise<FullSyncSummary> {
    const summary: FullSyncSummary = {
        department: ualbertaDepartment,
        rmpScraped: 0, rmpSaved: 0, ualbertaScraped: 0,
        matchedToRMP: 0, newProfessors: 0,
        coursesLinked: 0, coursesFailed: 0, errors: []
    };

    try {
        const rmpDepartment = normalizeDepartment(ualbertaDepartment);
        console.log(`\n=== Full Professor Sync for ${ualbertaDepartment} ===`);
        console.log(`RMP department: ${rmpDepartment}`);

        const rmpProfessors = await getProfessor(schoolId, rmpDepartment, rmpDepartmentId);
        summary.rmpScraped = rmpProfessors.length;

        summary.rmpSaved = await bulkSaveProfessors(rmpProfessors);

        const ualbertaProfessors = await fetchProfessors(ualbertaDepartment);
        summary.ualbertaScraped = ualbertaProfessors.length;

        if (ualbertaProfessors.length === 0) {
            console.log('No professors found in UAlberta directory');
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
        summary.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`);
        throw error;
    }
}
