/*
* This file is responsible for scraping professor data from RateMyProfessor.
* Will be expanded later to handle saving to prof table, and also for decoding base64 school and department IDs (could be in util as well).
*/
import { db } from "../config/db/index";
import { professors } from "../config/db/professors";
import { sql } from "drizzle-orm";
import { Professor, QueryObject, variables, payload } from "./types";

const RMP_API_URL = "https://www.ratemyprofessors.com/graphql";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mimics the query used by rate my professor
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



function buildQueryString(sId: string, dId: string, name: string, cursor: string): string {
    const objectHashMap: any = {
        "schoolID": sId,
        "text": "",
        "fallback": false
    }

    if (dId && dId !== "") {
        objectHashMap["departmentID"] = dId;
    }

    const variables: variables = {
        "query": objectHashMap,
        "first": 100,
        "schoolID": sId,
        "includeSchoolFilter": true,
    }

    if (cursor != null && cursor != "") {
        variables["after"] = cursor;
    }

    const payload: payload = {
        "query": query,
        "variables": variables
    }

    return JSON.stringify(payload);
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

    if (response.status != 200) {
        throw new Error(`HTTP error status: ${response.status}`);
    }

    const data: any = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
}


export async function getProfessor(sId: string = "U2Nob29sLTE0MDc=", departmentName: string = "", dId: string = "") {
    const allProfs: Professor[] = [];
    let cursor: string = "";
    let hasNextPage: boolean = true;

    const schoolId: string = sId;
    const departmentId: string = dId;

    console.log(`Params --> school: ${schoolId}, department: ${departmentName}, departmentId: ${departmentId}`);

    while (hasNextPage) {
        const payload: string = buildQueryString(schoolId, departmentId, departmentName, cursor);

        const data: any = await executeGraphQLQuery(payload);

        if (!data?.search?.teachers) {
            console.error("Unexpected API response structure:", data);
            throw new Error("Invalid API response structure");
        }

        const professors: any = data.search.teachers.edges || [];
        console.log(`Fetched ${professors.length} professors in this batch`);

        for (const professor of professors) {
            const parsedProfessor: Professor = parseProfessor(professor.node, departmentName);
            allProfs.push(parsedProfessor);
        }

        cursor = data.search.teachers.pageInfo.endCursor || "";
        hasNextPage = data.search.teachers.pageInfo.hasNextPage || false;

        console.log(`Total professors so far: ${allProfs.length}, hasNextPage: ${hasNextPage}`);

        // 2 - 3 seconds between requests
        if (hasNextPage) {
            const delay = 2000 + Math.floor(Math.random() * 1000);
            await sleep(delay);
        }
    }

    console.log(`Total profs: ${allProfs.length}`);
    return allProfs;
}


function parseProfessor(node: any, filterDepartment: string): Professor {
    try {
        const rmpId: number = node.legacyId;
        const firstName: string = node.firstName;
        const lastName: string = node.lastName;
        const department: string = node.department || filterDepartment;
        const avgRating: number = node.avgRating;
        const avgDifficulty: number = node.avgDifficulty;
        const numRatings: number = node.numRatings;
        const wouldTakeAgainPercentage: number = Math.round(node.wouldTakeAgainPercent || 0);
        const id: string = node.id;
        const createdAt: string = new Date().toISOString();

        const professor: Professor = {
            rmp_id: rmpId, first_name: firstName, last_name: lastName, department: department, avg_rating: avgRating, difficulty: avgDifficulty, num_ratings: numRatings, would_take_again: wouldTakeAgainPercentage, id: id,
            created_at: createdAt
        }
        console.log(JSON.stringify(professor, null, 2));
        return professor;
    } catch (error) {
        console.error("Error parsing professor:", error);
        throw error;
    }
}

export async function bulkSaveProfessors(professorList: Professor[]) {
    if (professorList.length === 0) return 0;

    // Deduplicate by name (lowercased), keeping the entry with most reviews
    // This handles cases where the same professor has multiple RMP profiles
    const dedupedByName = new Map<string, Professor>();
    for (const prof of professorList) {
        const nameKey = `${prof.first_name} ${prof.last_name}`.toLowerCase();
        const existing = dedupedByName.get(nameKey);
        if (!existing || prof.num_ratings > existing.num_ratings) {
            dedupedByName.set(nameKey, prof);
        }
    }
    const uniqueProfessors = Array.from(dedupedByName.values());
    console.log(`Deduplicated ${professorList.length} professors to ${uniqueProfessors.length} unique by name`);

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

    try {
        // Upsert using rmp_id as conflict target
        // Only update if new data has more reviews (more reviews = more reliable data)
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

        console.log(`Saved ${professorList.length} professors to database`);
        return professorList.length;
    } catch (error) {
        console.error("Error bulk saving professors:", error);
        throw error;
    }
}