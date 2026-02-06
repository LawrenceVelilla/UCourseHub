import { OpenAI } from 'openai';
import { BASE_PROMPT } from './base-prompt.js';
import { db } from '../db/config.js';
import { courses } from '../db/courses.js';
import { v4 as uuidv4 } from 'uuid';
import { FinalCourseDetails, RawCourse } from './types.js';
import { scrapeCoursePage } from '../scrapers/course-catalogue.js';

async function descriptionParser(description: string): Promise<any> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'user', content: description },
            { role: 'system', content: BASE_PROMPT }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;

    try {
        if (!result) return null;
        const parsed = JSON.parse(result);
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
        console.error('Error parsing JSON');
        return null;
    }
}

export async function processCourse(rawCourse: RawCourse): Promise<FinalCourseDetails | null> {
    console.log("parsing course: " + rawCourse.courseCode);
    const parsed = await descriptionParser(rawCourse.description);

    if (!parsed) return null;

    return {
        department: rawCourse.department,
        courseCode: rawCourse.courseCode,
        description: rawCourse.description,
        title: rawCourse.title,
        keywords: parsed.keywords,
        units: rawCourse.units,
        requirements: parsed.requirements,
        flattenedPrerequisites: parsed.flattenedPrerequisites || [],
        flattenedCorequisites: parsed.flattenedCorequisites || [],
        url: rawCourse.url || null,
        updatedAt: new Date().toISOString(),
    };
}

export async function processDepartment(rawCourses: RawCourse[]): Promise<FinalCourseDetails[]> {
    const processed: FinalCourseDetails[] = [];

    for (const course of rawCourses) {
        const parsed = await processCourse(course);
        if (!parsed) return [];
        processed.push(parsed);
    }

    return processed;
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
            target: [courses.courseCode],
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
        console.log(`Saved course: ${courseDetails.courseCode}`);
    } catch (error) {
        console.error(`Error saving course ${courseDetails.courseCode}:`, error);
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

    return processDepartment(rawCourses);
}

export async function scrapeAndSaveDepartmentCourses(departmentCode: string, from: number = 0, to: number = -1): Promise<number> {
    const processedCourses = await scrapeDepartmentCourses(departmentCode, from, to);

    let savedCount = 0;
    for (const course of processedCourses) {
        try {
            await saveCourse(course);
            savedCount++;
        } catch (error) {
            console.error(`Failed to save course ${course.courseCode}`);
        }
    }

    return savedCount;
}
