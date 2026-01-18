export interface RawCourse {
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

export function scrapeCoursePage(url: string): Promise<RawCourse[] | null>;
