interface Professor {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    rmpId: number;
    wouldTakeAgainPercentage: number;
    numRatings: number;
    avgRating: number;
    avgDifficulty: number;
    createdAt: string;
}

interface QueryObject {
    schoolID: string;
    text: string;
    fallback: boolean;
    departmentID?: string;
}

interface variables {
    query: QueryObject;
    first: number;
    after?: string;
    schoolID: string;
    includeSchoolFilter: boolean;
}

interface payload {
    query: string;
    variables: variables;
}



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
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

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
        const department: string = filterDepartment || node.department;
        const avgRating: number = node.avgRating;
        const avgDifficulty: number = node.avgDifficulty;
        const numRatings: number = node.numRatings;
        const wouldTakeAgainPercentage: number = node.wouldTakeAgainPercent.toFixed(2);
        const id: string = node.id;
        const createdAt: string = new Date().toISOString();

        const professor: Professor = {
            rmpId, firstName, lastName, department, avgRating, avgDifficulty, numRatings, wouldTakeAgainPercentage, id,
            createdAt
        }
        console.log(JSON.stringify(professor, null, 2));
        return professor;
    } catch (error) {
        console.error("Error parsing professor:", error);
        throw error;
    }
}