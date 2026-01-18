import { pgTable, text, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { professors } from "./professors";
import { courses } from "./courses";

// Junction table for many-to-many relationship between professors and courses
export const professorCourses = pgTable('professor_courses', {
    professorId: text('professor_id').notNull().references(() => professors.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.professorId, table.courseId] }),
    // Index for reverse lookups (find all professors for a course)
    courseIdx: index('idx_professor_courses_course').on(table.courseId),
}));
