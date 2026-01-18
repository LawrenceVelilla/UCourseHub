import { pgTable, text, uuid, primaryKey, index, integer } from "drizzle-orm/pg-core";
import { professors } from "./professors";
import { courses } from "./courses";

// Junction table for many-to-many relationship between professors and courses
export const professorCourses = pgTable('professor_courses', {
    professorId: text('professor_id').notNull().references(() => professors.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    year: integer('year').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.professorId, table.courseId, table.term, table.year] }),
    // Index for lookups
    courseIdx: index('idx_professor_courses_course').on(table.courseId),
    termYearIdx: index('idx_professor_courses_term_year').on(table.term, table.year),
}));
