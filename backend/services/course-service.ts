import { OpenAI } from 'openai';
import { BASE_PROMPT } from '../lib/base-prompt';
import { scrapeCoursePage } from '../scrapers/course-catalogue';
import { db } from '../config/db';
import { courses } from '../config/db/courses';
import { v4 as uuidv4 } from 'uuid';

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

async function descriptionParser(description: string): Promise<any> {
    const prompt = description
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
            {
                role: 'system',
                content: BASE_PROMPT
            },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;

    try {
        if (result === null) {
            console.error('Null result');
            return null;
        }

        const parsedResult = JSON.parse(result);

        if (typeof parsedResult === 'object' && parsedResult !== null) {
            return parsedResult;
        } else {
            console.error('Parsed result is not a valid JSON object:', parsedResult);
            return null;
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

export async function processCourse(rawCourse: RawCourse): Promise<any> {
    const courseToBeParsed = rawCourse;
    console.log("parsing course: " + courseToBeParsed.courseCode);
    const parsed = await descriptionParser(courseToBeParsed.description);
    console.log("parsed: ", parsed);
    if (parsed === null) {
        return null;
    }

    const finalDetails = {
        department: courseToBeParsed.department,
        courseCode: courseToBeParsed.courseCode,
        description: courseToBeParsed.description,
        title: courseToBeParsed.title,
        keywords: parsed.keywords,
        units: courseToBeParsed.units,
        requirements: parsed.requirements,
        flattenedPrerequisites: parsed.flattenedPrerequisites || [],
        flattenedCorequisites: parsed.flattenedCorequisites || [],
        url: courseToBeParsed.url || null,
        updatedAt: new Date().toISOString(),
    } as FinalCourseDetails;
    return finalDetails;
}

export async function processDepartment(
    rawCourses: RawCourse[]
): Promise<FinalCourseDetails[]> {
    let processedCourses: FinalCourseDetails[] = [];

    for (const course of rawCourses) {
        const parsed = await processCourse(course);
        if (parsed === null) {
            return [];
        }
        processedCourses.push(parsed);
    }
    return processedCourses;
}

export async function saveCourse(courseDetails: FinalCourseDetails): Promise<void> {
    try {
        await db.insert(courses).values({
            id: uuidv4(),
            department: courseDetails.department,
            courseCode: courseDetails.courseCode,
            title: courseDetails.title,
            description: courseDetails.description,
            units: courseDetails.units,
            keywords: courseDetails.keywords,
            requirements: courseDetails.requirements,
            flattenedPrerequisites: courseDetails.flattenedPrerequisites,
            flattenedCorequisites: courseDetails.flattenedCorequisites,
            url: courseDetails.url,
            updatedAt: new Date(),
            search_vector: undefined,
        }).onConflictDoUpdate({
            target: [courses.department, courses.courseCode],
            set: {
                title: courseDetails.title,
                description: courseDetails.description,
                units: courseDetails.units,
                keywords: courseDetails.keywords,
                requirements: courseDetails.requirements,
                flattenedPrerequisites: courseDetails.flattenedPrerequisites,
                flattenedCorequisites: courseDetails.flattenedCorequisites,
                url: courseDetails.url,
                updatedAt: new Date(),
            }
        });
        console.log(`Saved course: ${courseDetails.department} ${courseDetails.courseCode}`);
    } catch (error) {
        console.error(`Error saving course ${courseDetails.department} ${courseDetails.courseCode}:`, error);
        throw error;
    }
}

export async function scrapeDepartmentCourses(departmentCode: string, from: number = 0, to: number = -1): Promise<FinalCourseDetails[]> {
    const url = `https://apps.ualberta.ca/catalogue/course/${departmentCode}`;
    console.log(`Scraping courses from: ${url}`);

    let rawCourses = await scrapeCoursePage(url);
    if (!rawCourses || rawCourses.length === 0) {
        console.log(`No courses found for department: ${departmentCode}`);
        return [];
    }

    rawCourses = rawCourses.slice(from, to === -1 ? rawCourses.length : to);
    console.log(`Found ${rawCourses.length} courses for ${departmentCode}`);
    const processedCourses = await processDepartment(rawCourses);
    return processedCourses;
}

export async function scrapeAndSaveDepartmentCourses(departmentCode: string, from: number = 0, to: number = -1): Promise<number> {
    let processedCourses = await scrapeDepartmentCourses(departmentCode, from, to);

    let savedCount = 0;
    for (const course of processedCourses) {
        try {
            await saveCourse(course);
            savedCount++;
        } catch (error) {
            console.error(`Failed to save course ${course.department} ${course.courseCode}`);
        }
    }

    console.log(`Successfully saved ${savedCount}/${processedCourses.length} courses for ${departmentCode}`);
    return savedCount;
}