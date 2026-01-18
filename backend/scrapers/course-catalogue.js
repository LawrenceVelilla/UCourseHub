
/*

Scraping file that will get teh data and eventually feed it to a parser.
Gathers raw information from the course page

*/

import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';

// TODO: Add rate limiting

// The .course class used to identify each course block is causing 
// issues with the scraper as UofA has a duplicate course class for the same course
// IF the course is set to be updated during the date given

export async function scrapeCoursePage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const courses = [];
        $('.course').each((_, element) => {
            const $course = $(element);

            const headerText = $course.find('h2 a').text().trim();
            const courseUrl = $course.find('h2 a').attr('href');

            const title = headerText.match(
                /^([A-Z]+(?:\s[A-Z]+)?\s+\d+)\s*[-–—]?\s*(.*)/
            );
            let courseCode = title ? title[1] : '';
            let coursetitle = title ? title[2] : headerText;

            const section = coursetitle.match(/^([A-Z])\s*-\s*(.*)/);
            if (section) {
                courseCode = courseCode + section[1];
                coursetitle = section[2].trim();
            }

            // Extract department - handle multi-word departments like INT D
            let department = '';
            const deptMatch = courseCode.match(/^([A-Z]+(?:\s[A-Z]+)?)/);
            if (deptMatch) {
                department = deptMatch[1];
            }

            // Extract units
            const unitsText = $course.find('b').text().trim();
            const unitsMatch = unitsText.match(
                /(\d+)\s+units\s+\(fi\s+(\d+)\)\s*\(([^)]+)\)/
            );
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
        return null;
    }
}
