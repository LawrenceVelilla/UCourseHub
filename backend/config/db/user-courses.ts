import { pgTable, text, timestamp, uuid, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const userCourses = pgTable('user_courses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseCode: text('course_code').notNull(),
    term: text('term').notNull(),
    year: integer('year').notNull(),
    grade: text('grade'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('idx_user_courses_user').on(table.userId),
    uniqueIndex('idx_user_courses_unique').on(table.userId, table.courseCode),
]);
