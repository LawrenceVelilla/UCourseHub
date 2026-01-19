import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex, customType } from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
    dataType() {
        return 'tsvector';
    },
});

export const courses = pgTable('courses', {
    id: uuid('id').primaryKey(),
    department: text('department').notNull(),
    courseCode: text('courseCode').notNull(),
    title: text('title').notNull(),
    requirements: jsonb('requirements'),
    flattenedPrerequisites: jsonb('flattenedPrerequisites'),
    flattenedCorequisites: jsonb('flattenedCorequisites'),
    url: text('url'),
    keywords: jsonb('keywords'),
    description: text('description'),
    units: jsonb('units'),
    search_vector: tsvector('search_vector'),
    updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => [
    uniqueIndex('courses_department_courseCode_key')
        .on(table.department, table.courseCode),
    index('idx_courses_department').on(table.department),
    index('idx_courses_prereqs').using('gin', table.flattenedPrerequisites),
    index('idx_courses_coreqs').using('gin', table.flattenedCorequisites),
    index('idx_courses_search_vector').using('gin', table.search_vector),
]);



