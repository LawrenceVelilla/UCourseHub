import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import chrome from "selenium-webdriver/chrome.js";
import * as cheerio from "cheerio";
import { db } from "../db/config.js";
import { professors } from "../db/professors.js";
import { eq } from "drizzle-orm";

const validRoles: string[] = [
    "Professor", "Full Lecturer", "Associate Professor", "Associate Lecturer",
    "ATS Assistant Lecturer", "Full Professor", "Assistant Lecturer",
    "Adjunct Professor", "Assistant Professor", "ATS Full Lecturer",
    "Science Faculty Lecturer", "ATS Associate Lecturer", "Faculty Lecturer",
    "Asst Chair/Student Services", "Faculty Services Officer"
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

export async function filterByDepartment(department: string) {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

    try {
        if (department === "Psychology1") {
            department = "Psychology Science";
        }

        await driver.get(BASE_URL);
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

        await driver.sleep(5000);
        return await driver.getPageSource();
    } finally {
        await driver.quit();
    }
}

export async function getProfessors(pageSource: string) {
    const $ = cheerio.load(pageSource);
    const professors: any[] = [];

    $('tbody tr').each((_, element) => {
        const $professor = $(element);
        const name = $professor.find('td').first().find('a').text().trim();
        const url = $professor.find('td').first().find('a').attr('href');
        const role = $professor.find('td').eq(1).text().trim();
        professors.push({ name, url, role });
    });

    return professors.filter((prof) => validRoles.includes(prof.role));
}

export async function getProfessorInfo(url: string) {
    const fullUrl = `https://apps.ualberta.ca${url}`;
    const response = await fetch(fullUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const courses: ProfCourse[] = [];

    $('div.card').each((_, element) => {
        const $card = $(element);
        if ($card.find('div h2').text().trim() === 'Courses') {
            const termAndYear = $card.find('div div div a').text().trim();
            const split = termAndYear.split(' ');
            const term = split[0];
            const year = split[split.length - 1];

            $card.find('div h3').each((_, element1) => {
                $(element1).find('a').each((_, element2) => {
                    const $a = $(element2);
                    courses.push({
                        course: $a.text().trim(),
                        courseUrl: $a.attr('href') || '',
                        term,
                        year
                    });
                });
            });
        }
    });

    let name = $('h1').text().trim().split(',')[0];
    return { name, courses };
}

export async function fetchProfessors(department: string): Promise<ProfInfo[]> {
    const pageSource = await filterByDepartment(department);
    const basicProfs = await getProfessors(pageSource);

    const detailedProfs: ProfInfo[] = [];
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
    return db.select().from(professors).where(eq(professors.department, department));
}
