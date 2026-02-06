import { db } from "../config/db/index.js";
import { courses } from "../config/db/courses.js";
import { professors } from "../config/db/professors.js";
import { professorCourses } from "../config/db/professor_courses.js";
import { eq, sql, desc } from "drizzle-orm";


export async function fetchCourse(courseCode: string) {
    // Use index for faster search
    // We need to handle the case for triple codes like "INT D 200" where "INT D" is the department
    // Use case-insensitive comparison with UPPER()
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

    return results.map(prof => ({
        id: prof.id,
        name: prof.name,
        department: prof.department,
        rmpLink: prof.rmpId ? `https://www.ratemyprofessors.com/professor/${prof.rmpId}` : null,
        rating: prof.rating ? parseFloat(prof.rating) : null,
        difficulty: prof.difficulty ? parseFloat(prof.difficulty) : null,
        wouldTakeAgain: prof.wouldTakeAgain,
        numRatings: prof.numRatings,
        semester: `${prof.term} ${prof.year}`,
        term: prof.term,
        year: prof.year,
    }));
}
