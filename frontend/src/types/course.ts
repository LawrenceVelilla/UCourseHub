export interface Course {
    id: string;
    code: string;
    name: string;
    description: string;
    credits: number;
    tags: string[];
    availability: string[];
    prerequisites: PrerequisiteGroup | null;
    corequisites: string[];
    neededBy: NeededByCourse[];
}

export interface PrerequisiteGroup {
    type: 'one_of' | 'all_of';
    courses?: string[];
    groups?: PrerequisiteGroup[];
}

export interface NeededByCourse {
    code: string;
    name: string;
}

export interface Professor {
    id: string;
    name: string;
    department: string;
    rmpLink: string | null;
    rating: number | null;
    difficulty: number | null;
    wouldTakeAgain: number | null;
    numRatings: number | null;
    semester: string;
    term: string;
    year: number;
}

export interface RedditDiscussion {
    id: string;
    title: string;
    url: string;
    upvotes: number;
    comments: number;
    preview: string;
    createdAt: string;
}

export interface PlannedCourse {
    id: string;
    courseCode: string;
    year: number;
    semester: 'fall' | 'winter';
}

export interface GradeEntry {
    id: string;
    courseName: string;
    credits: number;
    grade: string;
}

export const GRADE_POINTS: Record<string, number> = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0,
};


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
        credits: number;
        feeIndex: number;
        term: string;
    };
    description: string;
    url: string;
}

export type FinalCourseDetails = {
    id: string;
    department: string;
    description: string;
    courseCode: string;
    title: string;
    keywords?: string[];
    units: {
        credits: number;
        feeIndex: number;
        term: string;
    };
    requirements: RequirementsData;
    flattenedPrerequisites: string[];
    flattenedCorequisites: string[];
    url: string | null;
    updatedAt: string;
}

