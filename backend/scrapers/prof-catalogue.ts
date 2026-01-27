// This file is for professor catalogue scraping
// Use selenium to navigate to the right page by pressing the right filters
// Then scrape the professors with the links to their pages using cheerio
// Then get the courses they are teaching with their corresponding page links using cheerio
import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import chrome from "selenium-webdriver/chrome.js";
import * as cheerio from "cheerio";
import { db } from "../config/db/index.js";
import { professors } from "../config/db/professors.js";
import { eq } from "drizzle-orm";

const validRoles: string[] = [
    "Professor", "Full Lecturer", "Associate Professor", "Associate Lecturer", "ATS Assistant Lecturer", "Full Professor", "Associate Professor", "Assistant Lecturer", "Adjunct Professor", "Assistant Professor", "ATS Full Lecturer", "Science Faculty Lecturer", "ATS Associate Lecturer", "Faculty Lecturer", "Asst Chair/Student Services", "Faculty Services Officer"
];


interface ProfCourse {
    course: string;
    courseUrl: string;
    term?: string;
    year?: string;
}

interface ProfInfo {
    name: string;
    url: string;
    role: string;
    courses: ProfCourse[];
}


const BASE_URL = "https://apps.ualberta.ca/directory/search/advanced";

// Flow --> Navigate to page --> Find field for depart --> Type department --> Press first reccomendation which should say the department --> Press search 
// --> Pass to cheerio --> Scrape professors 

// Id for the input field DepartmentId-ts-control
export async function filterByDepartment(department: string) {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

    try {
        if (department === "Psychology1") {
            department = "Psychology Science";
        } else if (department === "Psychology") {
            department = "Psychology";
        }
        console.log("Navigating to:", BASE_URL);
        await driver.get(BASE_URL);

        // Wait for page to load
        await driver.wait(until.elementLocated(By.id('DepartmentId-ts-control')), 10000);

        const departmentSelect = await driver.findElement(By.id('DepartmentId-ts-control'));
        await departmentSelect.click();
        await driver.sleep(500);

        await departmentSelect.sendKeys(department);
        await driver.sleep(1000);
        await departmentSelect.sendKeys(Key.ENTER);
        await driver.sleep(1000);

        const searchButton = await driver.findElement(By.xpath("//button[@type='submit' and normalize-space()='Search']"));

        await driver.executeScript("arguments[0].scrollIntoView(true);", searchButton);
        await driver.sleep(500);

        await driver.wait(until.elementIsEnabled(searchButton), 5000);

        try {
            await searchButton.click();
        } catch (e) {
            await driver.executeScript("arguments[0].click();", searchButton);
        }

        // Wait for results to load
        await driver.sleep(5000);

        const pageSource = await driver.getPageSource();
        return pageSource;
    } finally {
        await driver.quit();
    }
}

// Get the urls of professor only if they have a rating/page in rate my professor
export async function getProfessors(pageSource: string) {
    const $ = cheerio.load(pageSource);
    const professors: any[] = [];

    // Prof name and url in a tbody --> a, with href to their page, and class=stretched-link
    // prof role is in a title inside a the first td
    $('tbody tr').each((_, element) => {
        const $professor = $(element);
        const name = $professor.find('td').first().find('a').text().trim();
        const url = $professor.find('td').first().find('a').attr('href');
        const role = $professor.find('td').eq(1).text().trim();
        professors.push({ name, url, role });
    });

    const filteredProfessors = professors.filter((prof) => validRoles.includes(prof.role));
    return filteredProfessors;
}

export async function getProfessorInfo(url: string) {
    const PROF_URL = "https://apps.ualberta.ca";
    const fullUrl = `${PROF_URL}${url}`;

    console.log("Fetching professor info from:", fullUrl);

    const response = await fetch(fullUrl);
    const html = await response.text();

    const $ = cheerio.load(html);

    const courses: ProfCourse[] = [];
    // The h3 for courses has no clas fs-4 but the h3 for publications has it
    // So map the ones with no fs-4 to courses
    $('div.card').each((_, element) => {
        const $card = $(element);
        const temp: any = {};

        if ($card.find('div h2').text().trim() === 'Courses') {
            const termAndYear = $card.find('div div div a').text().trim();
            const split = termAndYear.split(' ');
            const term = split[0];
            const year = split[split.length - 1];

            $card.find('div h3').each((_, element1) => {
                $(element1).find('a').each((_, element2) => {
                    const $a = $(element2);
                    const course = $a.text().trim();
                    const courseUrl = $a.attr('href') || '';

                    courses.push({
                        course,
                        courseUrl,
                        term,
                        year
                    });
                });
            });
        }
    });

    let name = $('h1').text().trim();
    name = name.split(',')[0];

    console.log({ name, courses });

    return { name, courses };
}

export async function fetchProfessors(department: string): Promise<any> {

    const pageSource = await filterByDepartment(department);
    const basicProfs = await getProfessors(pageSource);

    const detailedProfs = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < basicProfs.length; i += BATCH_SIZE) {
        const batch = basicProfs.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
            batch.map(async (prof) => {
                try {
                    const fullInfo = { ...prof, courses: [] };

                    if (prof.url) {
                        const details = await getProfessorInfo(prof.url);
                        Object.assign(fullInfo, details);
                    }

                    return fullInfo;
                } catch (error) {
                    console.error(`Failed to fetch details for ${prof.name}:`, error);
                    return prof;
                }
            })
        );

        detailedProfs.push(...batchResults);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return detailedProfs;
}

export async function getDepartmentProfessors(department: string) {
    const profs = await db.select().from(professors).where(eq(professors.department, department));
    return profs;
}