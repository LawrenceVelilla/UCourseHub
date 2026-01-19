export interface SavePostResult {
    postId: string;
    isNew: boolean;
    coursesLinked: number;
}

export interface ScrapeResult {
    query: string;
    postsScraped: number;
    postsNew: number;
    postsSaved: number;
    commentsSaved: number;
    coursesLinked: number;
    errors: string[];
}

export interface Professor {
    id: string;
    first_name: string;
    last_name: string;
    department: string;
    rmp_id: number;
    would_take_again: number;
    num_ratings: number;
    avg_rating: number;
    difficulty: number;
    created_at: string;
}

export interface QueryObject {
    schoolID: string;
    text: string;
    fallback: boolean;
    departmentID?: string;
}

export interface variables {
    query: QueryObject;
    first: number;
    after?: string;
    schoolID: string;
    includeSchoolFilter: boolean;
}

export interface payload {
    query: string;
    variables: variables;
}

export interface FullSyncSummary {
    department: string;
    rmpScraped: number;
    rmpSaved: number;
    ualbertaScraped: number;
    matchedToRMP: number;
    newProfessors: number;
    coursesLinked: number;
    coursesFailed: number;
    errors: string[];
}

export interface ProfCourse {
    course: string;
    courseUrl: string;
    term?: string;
    year?: string;
}

export interface ScrapedProfessor {
    name: string;
    url: string;
    role: string;
    courses: ProfCourse[];
}

export interface MatchResult {
    professorId: string;
    isNewProfessor: boolean;
    professorName: string;
}

export interface LinkResult {
    linked: number;
    failed: number;
    details: { courseCode: string; success: boolean; reason?: string }[];
}

export interface SyncSummary {
    totalScraped: number;
    matched: number;
    newProfessors: number;
    coursesLinked: number;
    coursesFailed: number;
    errors: string[];
}

export type RequirementsData = {
    prerequisites?: RequirementCondition;
    corequisites?: RequirementCondition;
    notes?: string;
}

export type RequirementCondition = {
    operator: 'AND' | 'OR' | 'STANDALONE' | 'WILDCARD' | string;
    conditions?: RequirementCondition[];
    courses?: string[];
    pattern?: string;
    description?: string;
}

export type RawCourse = {
    department: string;
    courseCode: string;
    title: string;
    units: {
        credits: number | null;
        feeIndex: number | null;
        term: string | null;
    };
    description: string;
    url: string | undefined;
}

export type FinalCourseDetails = {
    department: string;
    description: string;
    courseCode: string;
    title: string;
    keywords?: string[];
    units: {
        credits: number | null;
        feeIndex: number | null;
        term: string | null;
    };
    requirements: RequirementsData;
    flattenedPrerequisites: string[];
    flattenedCorequisites: string[];
    url: string | null;
    updatedAt: string;
}