import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex, customType } from "drizzle-orm/pg-core";

// Custom type for PostgreSQL tsvector (full-text search)
const tsvector = customType<{ data: string }>({
    dataType() {
        return 'tsvector';
    },
});


// In public schema
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
    searchVector: tsvector('searchVector'),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    // Unique constraint: one course code per department
    departmentCourseCodeUnique: uniqueIndex('courses_department_courseCode_key')
        .on(table.department, table.courseCode),
    // Index for department lookups
    departmentIdx: index('idx_courses_department').on(table.department),
    // GIN indexes for array searches
    prereqsIdx: index('idx_courses_prereqs').using('gin', table.flattenedPrerequisites),
    coreqsIdx: index('idx_courses_coreqs').using('gin', table.flattenedCorequisites),
    // Full-text search index
    searchVectorIdx: index('idx_courses_search_vector').using('gin', table.searchVector),
}));



