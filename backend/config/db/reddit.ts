import { pgTable, text, integer, timestamp, index, primaryKey, uuid } from "drizzle-orm/pg-core";
import { courses } from "./courses.js";

export const redditPosts = pgTable('reddit_posts', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    selftext: text('selftext'),
    url: text('url').notNull(),
    score: integer('score').default(0),
    numComments: integer('num_comments').default(0),
    createdUtc: timestamp('created_utc').notNull(),
    scrapedAt: timestamp('scraped_at').defaultNow(),
    mentionedCourses: text('mentioned_courses').array(),
}, (table) => [
    index('idx_reddit_posts_score').on(table.score),
    index('idx_reddit_posts_created').on(table.createdUtc),
]);


export const redditPostCourses = pgTable('reddit_post_courses', {
    postId: text('post_id').notNull().references(() => redditPosts.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.postId, table.courseId] }),
    index('idx_reddit_post_courses_course').on(table.courseId),
]);


export const redditComments = pgTable('reddit_comments', {
    id: text('id').primaryKey(),
    postId: text('post_id').notNull().references(() => redditPosts.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    body: text('body').notNull(),
    score: integer('score').default(0),
    createdUtc: timestamp('created_utc').notNull(),
    url: text('url'),
}, (table) => [
    index('idx_reddit_comments_post').on(table.postId),
    index('idx_reddit_comments_score').on(table.score),
]);
