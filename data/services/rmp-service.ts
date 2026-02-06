import { db } from "../db/config.js";
import { professors } from "../db/professors.js";
import { sql } from "drizzle-orm";
import { Professor, variables, payload } from "./types.js";

const RMP_API_URL = "https://www.ratemyprofessors.com/graphql";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const query: string = `query TeacherSearchResultsPageQuery(
    $query: TeacherSearchQuery!
    $first: Int!
    $after: String
) {
    search: newSearch {
        teachers(query: $query, first: $first, after: $after) {
            edges {
                node {
                    id
                    legacyId
                    firstName
                    lastName
                    department
                    avgRating
                    avgDifficulty
                    numRatings
                    wouldTakeAgainPercent
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
}`;

function buildQueryString(sId: string, dId: string, cursor: string): string {
    const queryObj: any = { schoolID: sId, text: "", fallback: false };
    if (dId) queryObj.departmentID = dId;

    const vars: variables = {
        query: queryObj,
        first: 100,
        schoolID: sId,
        includeSchoolFilter: true,
    };
    if (cursor) vars.after = cursor;

    return JSON.stringify({ query, variables: vars } as payload);
}

async function executeGraphQLQuery(payload: string): Promise<any> {
    const response = await fetch(RMP_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic dGVzdDp0ZXN0",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Referer": "https://www.ratemyprofessors.com/"
        },
        body: payload,
    });

    if (response.status !== 200) throw new Error(`HTTP error: ${response.status}`);

    const data: any = await response.json();
    if (data.errors) throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);

    return data.data;
}

function parseProfessor(node: any, filterDepartment: string): Professor {
    return {
        id: node.id,
        rmp_id: node.legacyId,
        first_name: node.firstName,
        last_name: node.lastName,
        department: node.department || filterDepartment,
        avg_rating: node.avgRating,
        difficulty: node.avgDifficulty,
        num_ratings: node.numRatings,
        would_take_again: Math.round(node.wouldTakeAgainPercent || 0),
        created_at: new Date().toISOString()
    };
}

export async function getProfessor(sId: string = "U2Nob29sLTE0MDc=", departmentName: string = "", dId: string = "") {
    const allProfs: Professor[] = [];
    let cursor = "";
    let hasNextPage = true;

    console.log(`Fetching RMP data: school=${sId}, dept=${departmentName}`);

    while (hasNextPage) {
        const payload = buildQueryString(sId, dId, cursor);
        const data = await executeGraphQLQuery(payload);

        if (!data?.search?.teachers) throw new Error("Invalid API response");

        const profs = data.search.teachers.edges || [];
        console.log(`Fetched ${profs.length} professors`);

        for (const prof of profs) {
            allProfs.push(parseProfessor(prof.node, departmentName));
        }

        cursor = data.search.teachers.pageInfo.endCursor || "";
        hasNextPage = data.search.teachers.pageInfo.hasNextPage || false;

        if (hasNextPage) await sleep(2000 + Math.random() * 1000);
    }

    console.log(`Total profs: ${allProfs.length}`);
    return allProfs;
}

export async function bulkSaveProfessors(professorList: Professor[]) {
    if (professorList.length === 0) return 0;

    // Deduplicate by name, keeping entry with most reviews
    const dedupedByName = new Map<string, Professor>();
    for (const prof of professorList) {
        const key = `${prof.first_name} ${prof.last_name}`.toLowerCase();
        const existing = dedupedByName.get(key);
        if (!existing || prof.num_ratings > existing.num_ratings) {
            dedupedByName.set(key, prof);
        }
    }

    const uniqueProfessors = Array.from(dedupedByName.values());
    console.log(`Deduplicated ${professorList.length} to ${uniqueProfessors.length}`);

    const values = uniqueProfessors.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        department: p.department,
        rmp_id: String(p.rmp_id),
        would_take_again: p.would_take_again,
        num_ratings: p.num_ratings,
        avg_rating: String(p.avg_rating),
        difficulty: String(p.difficulty),
    }));

    await db.insert(professors)
        .values(values)
        .onConflictDoUpdate({
            target: professors.rmp_id,
            set: {
                id: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.id ELSE ${professors.id} END`,
                name: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.name ELSE ${professors.name} END`,
                department: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.department ELSE ${professors.department} END`,
                would_take_again: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.would_take_again ELSE ${professors.would_take_again} END`,
                num_ratings: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.num_ratings ELSE ${professors.num_ratings} END`,
                avg_rating: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.avg_rating ELSE ${professors.avg_rating} END`,
                difficulty: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.difficulty ELSE ${professors.difficulty} END`,
                updatedAt: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN NOW() ELSE ${professors.updatedAt} END`,
            },
        });

    console.log(`Saved ${uniqueProfessors.length} professors`);
    return uniqueProfessors.length;
}
