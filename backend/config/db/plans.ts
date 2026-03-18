import { pgTable, text, timestamp, uuid, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const plans = pgTable('plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('idx_plans_user').on(table.userId),
]);

export const planCourses = pgTable('plan_courses', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').notNull().references(() => plans.id, { onDelete: 'cascade' }),
    courseCode: text('course_code').notNull(),
    year: integer('year').notNull(),
    term: text('term').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('idx_plan_courses_plan').on(table.planId),
    uniqueIndex('idx_plan_courses_unique').on(table.planId, table.courseCode),
]);
