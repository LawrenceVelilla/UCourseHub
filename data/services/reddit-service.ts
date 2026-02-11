import { db } from "../db/config.js";
import { redditPosts, redditComments, redditPostCourses } from "../db/reddit.js";
import { courses } from "../db/courses.js";
import { eq, sql } from "drizzle-orm";
import {
    fetchPostsPaginated, fetchPostComments, extractCourseCodes,
    filterQualityPosts, RedditPost, RedditComment
} from "../scrapers/reddit.js";
import { SavePostResult, ScrapeResult } from "./types.js";

type TierLevel = 'high' | 'medium' | 'low';

const DEPARTMENT_TIERS: Record<TierLevel, string[]> = {
    high: ['CMPUT', 'MATH', 'CHEM', 'PHYS', 'BIOL', 'ECON', 'PSYCO', 'ENGL'],
    medium: ['STAT', 'ACCTG', 'FIN', 'MARK', 'MINS', 'SOC', 'POLS', 'PHIL'],
    low: []
};

const TIER_CONFIG: Record<TierLevel, { pages: number; limit: number }> = {
    high: { pages: 10, limit: 100 },
    medium: { pages: 5, limit: 100 },
    low: { pages: 2, limit: 100 },
};

function getTier(department: string): TierLevel {
    const dept = department.toUpperCase();
    if (DEPARTMENT_TIERS.high.includes(dept)) return 'high';
    if (DEPARTMENT_TIERS.medium.includes(dept)) return 'medium';
    return 'low';
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function savePost(post: RedditPost, mentionedCourses: string[]): Promise<SavePostResult> {
    const result: SavePostResult = { postId: post.id, isNew: false, coursesLinked: 0 };

    const existing = await db
        .select({ id: redditPosts.id })
        .from(redditPosts)
        .where(eq(redditPosts.id, post.id))
        .limit(1);

    if (existing.length > 0) {
        await db.update(redditPosts)
            .set({ score: post.score, numComments: post.num_comments, mentionedCourses })
            .where(eq(redditPosts.id, post.id));
    } else {
        await db.insert(redditPosts).values({
            id: post.id,
            title: post.title,
            selftext: post.selftext,
            url: post.url,
            score: post.score,
            numComments: post.num_comments,
            createdUtc: new Date(post.created_utc * 1000),
            mentionedCourses,
        });
        result.isNew = true;
    }

    for (const courseCode of mentionedCourses) {
        const course = await db
            .select({ id: courses.id })
            .from(courses)
            .where(eq(courses.courseCode, courseCode))
            .limit(1);

        if (course.length > 0) {
            await db.insert(redditPostCourses)
                .values({ postId: post.id, courseId: course[0].id })
                .onConflictDoNothing();
            result.coursesLinked++;
        }
    }

    return result;
}

async function saveComments(postId: string, comments: RedditComment[]): Promise<number> {
    let saved = 0;
    for (const comment of comments) {
        await db.insert(redditComments)
            .values({
                id: comment.id,
                postId,
                parentId: comment.parent_id,
                body: comment.body,
                score: comment.score,
                createdUtc: new Date(comment.created_utc * 1000),
                url: comment.url,
            })
            .onConflictDoNothing();
        saved++;
    }
    return saved;
}

export async function scrapeRedditForDepartment(department: string): Promise<ScrapeResult> {
    const tier = getTier(department);
    const config = TIER_CONFIG[tier];
    console.log(`Scraping Reddit for ${department} (tier: ${tier}, pages: ${config.pages})`);

    const result: ScrapeResult = {
        query: department, postsScraped: 0, postsNew: 0,
        postsSaved: 0, commentsSaved: 0, coursesLinked: 0, errors: []
    };

    try {
        const posts = await fetchPostsPaginated(`"${department}"`, config.limit, config.pages);
        result.postsScraped = posts.length;

        const qualityPosts = filterQualityPosts(posts);
        console.log(`Found ${posts.length} posts, ${qualityPosts.length} quality posts`);

        for (const post of qualityPosts) {
            try {
                const text = `${post.title} ${post.selftext}`;
                const courseCodes = extractCourseCodes(text);
                const saveResult = await savePost(post, courseCodes);

                result.postsSaved++;
                if (saveResult.isNew) result.postsNew++;
                result.coursesLinked += saveResult.coursesLinked;

                if (post.num_comments > 0) {
                    const comments = await fetchPostComments(post.id, 50);
                    result.commentsSaved += await saveComments(post.id, comments);
                    await sleep(500);
                }
            } catch (error) {
                result.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
        }
    } catch (error) {
        result.errors.push(`Department scrape failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    console.log(`Completed ${department}: ${result.postsSaved} posts, ${result.commentsSaved} comments`);
    return result;
}

export async function scrapeRedditForCourse(courseCode: string, maxPages: number = 2): Promise<ScrapeResult> {
    console.log(`Scraping Reddit for course: ${courseCode}`);

    const result: ScrapeResult = {
        query: courseCode, postsScraped: 0, postsNew: 0,
        postsSaved: 0, commentsSaved: 0, coursesLinked: 0, errors: []
    };

    try {
        const posts = await fetchPostsPaginated(`"${courseCode}"`, 100, maxPages);
        result.postsScraped = posts.length;

        for (const post of filterQualityPosts(posts)) {
            try {
                const text = `${post.title} ${post.selftext}`;
                const courseCodes = extractCourseCodes(text);
                if (!courseCodes.includes(courseCode)) courseCodes.push(courseCode);

                const saveResult = await savePost(post, courseCodes);
                result.postsSaved++;
                if (saveResult.isNew) result.postsNew++;
                result.coursesLinked += saveResult.coursesLinked;

                if (post.num_comments > 0) {
                    const comments = await fetchPostComments(post.id, 50);
                    result.commentsSaved += await saveComments(post.id, comments);
                    await sleep(500);
                }
            } catch (error) {
                result.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
        }
    } catch (error) {
        result.errors.push(`Course scrape failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return result;
}

export async function getDiscussionsByCourseId(courseId: string, limit: number = 10, offset: number = 0) {
    const postIds = await db
        .select({ postId: redditPostCourses.postId })
        .from(redditPostCourses)
        .where(eq(redditPostCourses.courseId, courseId));

    if (postIds.length === 0) return { discussions: [], hasMore: false };

    const ids = postIds.map(p => p.postId);

    const discussions = await db
        .select({
            id: redditPosts.id,
            title: redditPosts.title,
            preview: redditPosts.selftext,
            url: redditPosts.url,
            upvotes: redditPosts.score,
            comments: redditPosts.numComments,
            createdAt: redditPosts.createdUtc,
        })
        .from(redditPosts)
        .where(sql`${redditPosts.id} IN ${ids}`)
        .orderBy(sql`${redditPosts.score} DESC`)
        .limit(limit + 1)
        .offset(offset);

    const hasMore = discussions.length > limit;
    const result = hasMore ? discussions.slice(0, limit) : discussions;

    return {
        discussions: result.map(d => ({
            ...d,
            preview: d.preview ? d.preview.substring(0, 200) + (d.preview.length > 200 ? '...' : '') : '',
        })),
        hasMore,
    };
}
