import { db } from "../db/config.js";
import { professors } from "../db/professors.js";
import { courses } from "../db/courses.js";
import { professorCourses } from "../db/professor_courses.js";
import { eq, and, sql, ilike } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import {
    normalizeDepartment,
    parseNameParts,
    firstNamesMatch,
    extractCourseCode
} from "../utils/professor-utils.js";
import { ProfCourse, ScrapedProfessor, MatchResult, LinkResult, SyncSummary } from "./types.js";

export async function findMatchingProfessor(scrapedName: string, department: string): Promise<{ id: string; name: string } | null> {
    const { firstName, lastName } = parseNameParts(scrapedName);
    if (!lastName) return null;

    let matches = await db
        .select({ id: professors.id, name: professors.name })
        .from(professors)
        .where(and(eq(professors.department, department), ilike(professors.name, `%${lastName}`)));

    if (matches.length === 0) {
        matches = await db
            .select({ id: professors.id, name: professors.name })
            .from(professors)
            .where(ilike(professors.name, `%${lastName}`));
    }

    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    if (!firstName) return null;

    for (const candidate of matches) {
        const candidateParts = parseNameParts(candidate.name);
        if (firstNamesMatch(firstName, candidateParts.firstName)) {
            return candidate;
        }
    }

    return null;
}

export async function findCourseByCode(courseCode: string): Promise<{ id: string; courseCode: string } | null> {
    const result = await db
        .select({ id: courses.id, courseCode: courses.courseCode })
        .from(courses)
        .where(eq(courses.courseCode, courseCode))
        .limit(1);

    return result.length > 0 ? result[0] : null;
}

export async function saveProfessorCourse(professorId: string, courseId: string, term: string, year: number): Promise<void> {
    await db.insert(professorCourses)
        .values({ professorId, courseId, term, year })
        .onConflictDoNothing();
}

export async function linkProfessorToCourses(professorId: string, scrapedCourses: ProfCourse[]): Promise<LinkResult> {
    const result: LinkResult = { linked: 0, failed: 0, details: [] };

    for (const course of scrapedCourses) {
        const courseCode = extractCourseCode(course.course);

        if (!courseCode) {
            result.failed++;
            result.details.push({ courseCode: course.course, success: false, reason: 'Could not extract course code' });
            continue;
        }

        const dbCourse = await findCourseByCode(courseCode);
        if (!dbCourse) {
            result.failed++;
            result.details.push({ courseCode, success: false, reason: 'Course not found' });
            continue;
        }

        const term = course.term || 'Unknown';
        const year = course.year ? parseInt(course.year, 10) : new Date().getFullYear();

        try {
            await saveProfessorCourse(professorId, dbCourse.id, term, year);
            result.linked++;
            result.details.push({ courseCode, success: true });
        } catch (error) {
            result.failed++;
            result.details.push({ courseCode, success: false, reason: error instanceof Error ? error.message : 'Unknown' });
        }
    }

    return result;
}

export async function createProfessorWithoutRMP(name: string, department: string): Promise<string> {
    // Normalize whitespace so rescrapes match existing rows instead of inserting near-duplicates
    // (e.g. "David Rast III " vs "David Rast III"). Matches the normalization used on save.
    const cleanName = name.replace(/\s+/g, ' ').trim();

    const existing = await db
        .select({ id: professors.id })
        .from(professors)
        .where(and(
            eq(professors.department, department),
            sql`regexp_replace(btrim(lower(${professors.name})), '\s+', ' ', 'g') = ${cleanName.toLowerCase()}`
        ))
        .limit(1);

    if (existing.length > 0) return existing[0].id;

    // Upsert as a final guard against races / exact-name conflicts on the
    // (name, department) unique index. onConflictDoUpdate (not DoNothing) so
    // RETURNING always yields the row id, whether inserted or already present.
    const [row] = await db.insert(professors)
        .values({
            id: uuidv4(),
            name: cleanName,
            department,
            rmp_id: null,
            avg_rating: null,
            difficulty: null,
            would_take_again: null,
            num_ratings: 0,
        })
        .onConflictDoUpdate({
            target: [professors.name, professors.department],
            set: { updatedAt: new Date() },
        })
        .returning({ id: professors.id });

    return row.id;
}

export async function processProfessor(scrapedProf: ScrapedProfessor, department: string): Promise<{ matchResult: MatchResult; linkResult: LinkResult }> {
    const existingProf = await findMatchingProfessor(scrapedProf.name, department);

    let matchResult: MatchResult;
    if (existingProf) {
        matchResult = { professorId: existingProf.id, isNewProfessor: false, professorName: existingProf.name };
        console.log(`Matched "${scrapedProf.name}" → "${existingProf.name}"`);
    } else {
        const newId = await createProfessorWithoutRMP(scrapedProf.name, department);
        matchResult = { professorId: newId, isNewProfessor: true, professorName: scrapedProf.name };
        console.log(`Created new professor: "${scrapedProf.name}"`);
    }

    const linkResult = await linkProfessorToCourses(matchResult.professorId, scrapedProf.courses);
    return { matchResult, linkResult };
}

export async function syncProfessorsToCourses(scrapedProfessors: ScrapedProfessor[], ualbertaDepartment: string): Promise<SyncSummary> {
    const dbDepartment = normalizeDepartment(ualbertaDepartment);
    console.log(`Department mapping: "${ualbertaDepartment}" → "${dbDepartment}"`);

    const summary: SyncSummary = {
        totalScraped: scrapedProfessors.length,
        matched: 0, newProfessors: 0,
        coursesLinked: 0, coursesFailed: 0, errors: []
    };

    for (const prof of scrapedProfessors) {
        try {
            const { matchResult, linkResult } = await processProfessor(prof, dbDepartment);

            if (matchResult.isNewProfessor) summary.newProfessors++;
            else summary.matched++;

            summary.coursesLinked += linkResult.linked;
            summary.coursesFailed += linkResult.failed;

            linkResult.details
                .filter(d => !d.success)
                .forEach(d => summary.errors.push(`${prof.name}: ${d.courseCode} - ${d.reason}`));
        } catch (error) {
            summary.errors.push(`Failed to process ${prof.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }

    return summary;
}
