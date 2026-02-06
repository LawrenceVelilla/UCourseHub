import * as cheerio from 'cheerio';
import { RawCourse } from '../services/types.js';

export async function scrapeCoursePage(url: string): Promise<RawCourse[] | null> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const courses: RawCourse[] = [];

        $('.course').each((_, element) => {
            const $course = $(element);

            const headerText = $course.find('h2 a').text().trim();
            const courseUrl = $course.find('h2 a').attr('href');

            const title = headerText.match(/^([A-Z]+(?:\s[A-Z]+)?\s+\d+)\s*[-–—]?\s*(.*)/);
            let courseCode = title ? title[1] : '';
            let coursetitle = title ? title[2] : headerText;

            const section = coursetitle.match(/^([A-Z])\s*-\s*(.*)/);
            if (section) {
                courseCode = courseCode + section[1];
                coursetitle = section[2].trim();
            }

            let department = '';
            const deptMatch = courseCode.match(/^([A-Z]+(?:\s[A-Z]+)?)/);
            if (deptMatch) {
                department = deptMatch[1];
            }

            const unitsText = $course.find('b').text().trim();
            const unitsMatch = unitsText.match(/(\d+)\s+units\s+\(fi\s+(\d+)\)\s*\(([^)]+)\)/);
            const units = {
                credits: unitsMatch ? parseInt(unitsMatch[1]) : null,
                feeIndex: unitsMatch ? parseInt(unitsMatch[2]) : null,
                term: unitsMatch ? unitsMatch[3] : null,
            };

            let description = $course.find('p').text().trim();
            description = description.replace(/"\s*==\s*\$\d+$/, '').trim();
            description = description.replace(/^"(.+)"$/, '$1');

            courses.push({
                department,
                courseCode,
                title: coursetitle,
                units,
                description,
                url: courseUrl,
            });
        });

        return courses;
    } catch (error) {
        console.error('Error scraping course page:', error);
        return null;
    }
}
