import { pgTable, varchar, text, integer, timestamp, numeric, uniqueIndex } from "drizzle-orm/pg-core";

// In public schema
export const professors = pgTable('professors', {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    department: varchar('department', { length: 50 }).notNull(),
    rmp_id: text('rmp_id').unique(),
    avg_rating: numeric('avg_rating', { precision: 3, scale: 2 }),
    difficulty: numeric('difficulty', { precision: 3, scale: 2 }),
    would_take_again: integer('would_take_again'),
    num_ratings: integer('num_ratings').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    // Unique constraint: one professor name per department
    // Note: could cause issues if two professors share the same name
    nameDepartmentUnique: uniqueIndex('professors_name_department_key')
        .on(table.name, table.department),
}));