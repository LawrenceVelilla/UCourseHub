import { z } from "zod";

const redditPostSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    score: z.number(),
    num_comments: z.number(),
    created_utc: z.number(),
    selftext: z.string(),
});

const redditCommentSchema = z.object({
    id: z.string(),
    parent_id: z.string(),
    body: z.string(),
    score: z.number(),
    created_utc: z.number(),
    url: z.string(),
});

export type RedditPost = z.infer<typeof redditPostSchema>;
export type RedditComment = z.infer<typeof redditCommentSchema>;

const client_id = process.env.REDDIT_CLIENT_ID || "CmE8lqF33R2qj8pN9Awtiw";
const client_secret = process.env.REDDIT_CLIENT_SECRET || "SEJr8Komd1l8putrNDRisH464WWs4Q";
const user_agent = "typescript:u-coursemapscraper:v1.0 (by /u/Beneficial-Goat9925)";

const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1000;

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;


class RateLimiter {
    private requestTimestamps: number[] = [];
    private lastRequestTime: number = 0;

    async waitForSlot(): Promise<void> {
        const now = Date.now();

        // Clean old timestamps outside the window
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => now - ts < RATE_LIMIT_WINDOW_MS
        );

        // Check if we've hit the rate limit
        if (this.requestTimestamps.length >= RATE_LIMIT_REQUESTS) {
            const oldestRequest = this.requestTimestamps[0];
            const waitTime = RATE_LIMIT_WINDOW_MS - (now - oldestRequest) + 100;
            console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
            await sleep(waitTime);
            return this.waitForSlot(); // Recursive check
        }

        // Ensure minimum interval between requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
            await sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
        }

        // Record this request
        this.requestTimestamps.push(Date.now());
        this.lastRequestTime = Date.now();
    }

    getStats(): { requestsInWindow: number; windowMs: number } {
        const now = Date.now();
        const activeRequests = this.requestTimestamps.filter(
            ts => now - ts < RATE_LIMIT_WINDOW_MS
        );
        return {
            requestsInWindow: activeRequests.length,
            windowMs: RATE_LIMIT_WINDOW_MS
        };
    }
}

const rateLimiter = new RateLimiter();

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number): number {
    const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(backoff + jitter, MAX_BACKOFF_MS);
}


let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    const auth = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch("https://www.reddit.com/api/v1/access_token", {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": user_agent,
                },
                body: "grant_type=client_credentials",
            });

            if (!response.ok) {
                if (response.status === 429) {
                    const backoff = calculateBackoff(attempt);
                    console.log(`Token request rate limited. Retrying in ${backoff}ms...`);
                    await sleep(backoff);
                    continue;
                }
                throw new Error(`Failed to get Reddit access token: ${response.status}`);
            }

            const data: any = await response.json();
            cachedToken = {
                token: data.access_token,
                expiresAt: Date.now() + (data.expires_in - 60) * 1000,
            };
            return cachedToken.token;

        } catch (error) {
            if (attempt === MAX_RETRIES - 1) throw error;
            const backoff = calculateBackoff(attempt);
            console.log(`Token request failed. Retrying in ${backoff}ms...`, error);
            await sleep(backoff);
        }
    }

    throw new Error("Failed to get access token after max retries");
}

interface FetchOptions {
    maxRetries?: number;
    skipRateLimit?: boolean;
}

async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<any> {
    const { maxRetries = MAX_RETRIES, skipRateLimit = false } = options;
    const token = await getAccessToken();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (!skipRateLimit) {
                await rateLimiter.waitForSlot();
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "User-Agent": user_agent,
                },
            });

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const backoff = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : calculateBackoff(attempt);
                console.log(`Rate limited (429). Waiting ${backoff}ms before retry...`);
                await sleep(backoff);
                continue;
            }
            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;

            if (isLastAttempt) {
                throw error;
            }

            const backoff = calculateBackoff(attempt);
            console.log(`Request failed (attempt ${attempt + 1}/${maxRetries}). Retrying in ${backoff}ms...`);
            await sleep(backoff);
        }
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
}

export async function fetchPosts(courseCode: string, limit: number): Promise<RedditPost[]> {
    const query = encodeURIComponent(`"${courseCode}"`);
    const url = `https://oauth.reddit.com/r/uAlberta/search?q=${query}&restrict_sr=true&limit=${limit}`;

    const data = await fetchWithRetry(url);
    return data.data.children.map((post: any) => redditPostSchema.parse(post.data));
}

export async function fetchPostComments(post_id: string, limit: number): Promise<RedditComment[]> {
    const url = `https://oauth.reddit.com/r/uAlberta/comments/${post_id}/?limit=${limit}`;

    const data = await fetchWithRetry(url);

    // Reddit returns [postListing, commentsListing]
    const comments = data[1].data.children
        .filter((c: any) => c.kind === "t1") // t1 = comment, filter out "more" items
        .map((comment: any) => ({
            ...comment.data,
            url: `https://www.reddit.com${comment.data.permalink}`,
        }));

    return comments.map((c: any) => redditCommentSchema.parse(c));
}


export async function fetchPostsPaginated(query: string, limit: number = 100, maxPages: number = 1): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];
    let after: string | null = null;

    for (let page = 0; page < maxPages; page++) {
        const encodedQuery = encodeURIComponent(query);
        let url = `https://oauth.reddit.com/r/uAlberta/search?q=${encodedQuery}&restrict_sr=true&limit=${limit}&sort=relevance`;

        if (after) {
            url += `&after=${after}`;
        }

        try {
            const data = await fetchWithRetry(url);
            const posts = data.data.children.map((post: any) => redditPostSchema.parse(post.data));
            allPosts.push(...posts);

            after = data.data.after;
            if (!after) {
                console.log(`No more pages after page ${page + 1}`);
                break;
            }

            console.log(`Fetched page ${page + 1}/${maxPages}, total posts: ${allPosts.length}`);

        } catch (error) {
            console.error(`Error fetching page ${page + 1}:`, error);
            break;
        }
    }

    return allPosts;
}

export function extractCourseCodes(text: string): string[] {
    const regex = /\b([A-Z]{2,8})\s*(\d{3}[A-Z]?)\b/gi;
    const matches = [...text.matchAll(regex)];
    const codes = matches.map(m => `${m[1].toUpperCase()} ${m[2].toUpperCase()}`);
    return [...new Set(codes)];
}

export function filterQualityPosts(posts: RedditPost[]): RedditPost[] {
    return posts.filter(p => p.score >= 5 || p.num_comments > 2);
}

