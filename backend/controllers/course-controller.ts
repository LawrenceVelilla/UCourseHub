import { db } from "../config/db/index.js";
import { courses } from "../config/db/courses.js";
import { professors } from "../config/db/professors.js";
import { professorCourses } from "../config/db/professor_courses.js";
import { eq, sql, desc } from "drizzle-orm";

// Approximate 0-indexed start month of each UAlberta term, used to decide term recency.
const TERM_START_MONTH: Record<string, number> = {
    Winter: 0, // January
    Spring: 4, // May
    Summer: 6, // July
    Fall: 8,   // September
};

// A teaching term is shown if it's in the future or started within the last 12 months.
// Older terms are hidden (not deleted) so stale instructors drop off automatically.
function isRecentTerm(term: string, year: number): boolean {
    const termDate = new Date(year, TERM_START_MONTH[term] ?? 0, 1);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return termDate >= oneYearAgo;
}


export async function fetchCourseList() {
    const result = await db
        .select({ courseCode: courses.courseCode, title: courses.title })
        .from(courses)
        .orderBy(courses.courseCode);
    return result;
}

export async function fetchCourse(courseCode: string) {
    // Need to handle the case for triple codes like "INT D 200" where "INT D" is the department
    const normalizedCode = courseCode.toUpperCase().trim();

    const course = await db.select().from(courses).where(
        sql`UPPER(${courses.courseCode}) = ${normalizedCode}`
    );

    return course;
}

export async function fetchDependents(courseCode: string) {
    const start = Date.now();
    // Normalize to uppercase to match DB storage format
    const normalizedCode = courseCode.toUpperCase().trim();
    const jsonbArray = JSON.stringify([normalizedCode]);

    const dependents = await db.select({
        id: courses.id,
        courseCode: courses.courseCode,
        title: courses.title,
        department: courses.department,
        flattenedPrerequisites: courses.flattenedPrerequisites,
        flattenedCorequisites: courses.flattenedCorequisites,
    })
        .from(courses)
        .where(
            sql`${courses.flattenedPrerequisites} @> ${jsonbArray}::jsonb
            OR ${courses.flattenedCorequisites} @> ${jsonbArray}::jsonb`
        );

    console.log(`DB query took: ${Date.now() - start}ms`);
    const prereqDependents = dependents.filter(c => {
        const prereqs = Array.isArray(c.flattenedPrerequisites)
            ? c.flattenedPrerequisites
            : [];
        return prereqs.includes(normalizedCode);
    });

    const coreqDependents = dependents.filter(c => {
        const coreqs = Array.isArray(c.flattenedCorequisites)
            ? c.flattenedCorequisites
            : [];
        return coreqs.includes(normalizedCode);
    });

    console.log(`Total time: ${Date.now() - start}ms`);
    return { prereqDependents, coreqDependents };
}

export async function fetchProfessorsByCourseId(courseId: string) {
    // Query professor_courses by course_id (hits idx_professor_courses_course)
    // Join with professors table via foreign key
    const results = await db
        .select({
            id: professors.id,
            name: professors.name,
            department: professors.department,
            rmpId: professors.rmp_id,
            rating: professors.avg_rating,
            difficulty: professors.difficulty,
            wouldTakeAgain: professors.would_take_again,
            numRatings: professors.num_ratings,
            term: professorCourses.term,
            year: professorCourses.year,
        })
        .from(professorCourses)
        .innerJoin(professors, eq(professorCourses.professorId, professors.id))
        .where(eq(professorCourses.courseId, courseId))
        .orderBy(desc(professorCourses.year), desc(professorCourses.term));

    // A professor may teach the same course across multiple terms, which yields
    // one join row per (term, year). Collapse to a single entry per professor,
    // keeping the most recent term (results are ordered year desc, term desc) and
    // listing every semester they've taught it.
    const byProfessor = new Map<string, {
        id: string;
        name: string;
        department: string;
        rmpLink: string | null;
        rating: number | null;
        difficulty: number | null;
        wouldTakeAgain: number | null;
        numRatings: number | null;
        semester: string;
        semesters: string[];
        term: string;
        year: number;
    }>();

    for (const prof of results) {
        if (!isRecentTerm(prof.term, prof.year)) continue; // hide terms older than a year
        const semester = `${prof.term} ${prof.year}`;
        const existing = byProfessor.get(prof.id);
        if (existing) {
            existing.semesters.push(semester);
            continue;
        }
        byProfessor.set(prof.id, {
            id: prof.id,
            name: prof.name,
            department: prof.department,
            rmpLink: prof.rmpId ? `https://www.ratemyprofessors.com/professor/${prof.rmpId}` : null,
            rating: prof.rating ? parseFloat(prof.rating) : null,
            difficulty: prof.difficulty ? parseFloat(prof.difficulty) : null,
            wouldTakeAgain: prof.wouldTakeAgain,
            numRatings: prof.numRatings,
            semester, // most recent
            semesters: [semester], // all terms taught, most recent first
            term: prof.term,
            year: prof.year,
        });
    }

    return Array.from(byProfessor.values());
}
