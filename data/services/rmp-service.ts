import { db } from "../db/config.js";
import { professors } from "../db/professors.js";
import { sql, eq, inArray } from "drizzle-orm";
import { getDepartmentAliases } from "../utils/professor-utils.js";
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
        would_take_again: normalizeWouldTakeAgain(node.wouldTakeAgainPercent),
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

function normalizeWouldTakeAgain(value: number | null | undefined): number | null {
    if (value == null || value < 0) return null;
    return Math.round(value);
}

function professorName(prof: Professor): string {
    return `${prof.first_name} ${prof.last_name}`.replace(/\s+/g, ' ').trim();
}

function normalizedNameKey(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function bulkSaveProfessors(professorList: Professor[]) {
    if (professorList.length === 0) return 0;

    // Deduplicate by name, keeping entry with most reviews
    const dedupedByName = new Map<string, Professor>();
    for (const prof of professorList) {
        const key = professorName(prof).toLowerCase();
        const existing = dedupedByName.get(key);
        if (!existing || prof.num_ratings > existing.num_ratings) {
            dedupedByName.set(key, prof);
        }
    }

    const uniqueProfessors = Array.from(dedupedByName.values());
    console.log(`Deduplicated ${professorList.length} to ${uniqueProfessors.length}`);

    const department = uniqueProfessors[0]?.department;
    const departmentAliases = department ? getDepartmentAliases(department) : [];
    const existingRows = departmentAliases.length > 0
        ? await db.select().from(professors).where(inArray(professors.department, departmentAliases))
        : [];
    const existingByName = new Map(
        existingRows.map(row => [normalizedNameKey(row.name), row])
    );

    const toInsert: typeof uniqueProfessors = [];
    let updated = 0;

    for (const prof of uniqueProfessors) {
        const name = professorName(prof);
        const existing = existingByName.get(normalizedNameKey(name));

        if (existing) {
            if (prof.num_ratings <= (existing.num_ratings ?? 0)) continue;

            await db.update(professors)
                .set({
                    rmp_id: String(prof.rmp_id),
                    would_take_again: normalizeWouldTakeAgain(prof.would_take_again),
                    num_ratings: prof.num_ratings,
                    avg_rating: String(prof.avg_rating),
                    difficulty: String(prof.difficulty),
                    updatedAt: new Date(),
                })
                .where(eq(professors.id, existing.id));
            updated++;
            continue;
        }

        toInsert.push(prof);
    }

    if (toInsert.length > 0) {
        const values = toInsert.map(p => ({
            id: p.id,
            name: professorName(p),
            department: p.department,
            rmp_id: String(p.rmp_id),
            would_take_again: normalizeWouldTakeAgain(p.would_take_again),
            num_ratings: p.num_ratings,
            avg_rating: String(p.avg_rating),
            difficulty: String(p.difficulty),
        }));

        try {
            await db.insert(professors)
                .values(values)
                .onConflictDoUpdate({
                    target: [professors.name, professors.department],
                    set: {
                        rmp_id: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.rmp_id ELSE ${professors.rmp_id} END`,
                        would_take_again: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.would_take_again ELSE ${professors.would_take_again} END`,
                        num_ratings: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.num_ratings ELSE ${professors.num_ratings} END`,
                        avg_rating: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.avg_rating ELSE ${professors.avg_rating} END`,
                        difficulty: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN EXCLUDED.difficulty ELSE ${professors.difficulty} END`,
                        updatedAt: sql`CASE WHEN EXCLUDED.num_ratings > COALESCE(${professors.num_ratings}, 0) THEN NOW() ELSE ${professors.updatedAt} END`,
                    },
                });
        } catch (error) {
            const cause = error instanceof Error && 'cause' in error ? error.cause : error;
            console.error('Professor insert failed:', cause);
            throw error;
        }
    }

    const saved = updated + toInsert.length;
    console.log(`Saved ${saved} professors (${updated} updated, ${toInsert.length} inserted)`);
    return saved;
}
