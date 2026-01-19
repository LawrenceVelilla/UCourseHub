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

const client_id = "CmE8lqF33R2qj8pN9Awtiw"
const client_secret = "SEJr8Komd1l8putrNDRisH464WWs4Q"
const user_agent = "typescript:u-coursemapscraper:v1.0 (by /u/Beneficial-Goat9925)"

let cachedToken: { token: string; expiresAt: number } | null = null;
// Criterias num_comments > 2 OR score > 5
let criteria = "num_comments > 2 OR score > 5";


async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    const auth = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
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
        throw new Error(`Failed to get Reddit access token: ${response.status}`);
    }

    const data: any = await response.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedToken.token;
}

export async function fetchPosts(courseCode: string, limit: number) {
    const token = await getAccessToken();

    const query = encodeURIComponent(`"${courseCode}"`);
    const response = await fetch(
        `https://oauth.reddit.com/r/uAlberta/search?q=${query}&restrict_sr=true&limit=${limit}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": user_agent,
            },
        }
    );
    const data: any = await response.json();
    return data.data.children.map((post: any) => redditPostSchema.parse(post.data));
}

export async function fetchPostComments(post_id: string, limit: number) {
    const token = await getAccessToken();
    const response = await fetch(
        `https://oauth.reddit.com/r/uAlberta/comments/${post_id}/?limit=${limit}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": user_agent,
            },
        }
    );
    const data: any = await response.json();
    // Reddit returns [postListing, commentsListing]
    const comments = data[1].data.children
        .filter((c: any) => c.kind === "t1") // t1 = comment, filter out "more" items
        .map((comment: any) => ({
            ...comment.data,
            url: `https://www.reddit.com${comment.data.permalink}`,
        }));
    return comments.map((c: any) => redditCommentSchema.parse(c));
}
