import { pgTable, text, uuid, primaryKey, index, integer } from "drizzle-orm/pg-core";
import { professors } from "./professors.js";
import { courses } from "./courses.js";

export const professorCourses = pgTable('professor_courses', {
    professorId: text('professor_id').notNull().references(() => professors.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    year: integer('year').notNull(),
}, (table) => [
    primaryKey({ columns: [table.professorId, table.courseId, table.term, table.year] }),
    index('idx_professor_courses_course').on(table.courseId),
    index('idx_professor_courses_term_year').on(table.term, table.year),
]);
