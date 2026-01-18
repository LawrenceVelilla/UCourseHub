// This file is for professor catalogue scraping
// Use selenium to navigate to the right page by pressing the right filters
// Then scrape the professors with the links to their pages
// Then get the courses they are teaching with their corresponding page links


import { Builder, Browser, By, Key, until } from 'selenium-webdriver';
import chrome from "selenium-webdriver/chrome";
import * as cheerio from "cheerio";
import { db } from "../config/db/index";
import { professors } from "../config/db/professors";
import { eq } from "drizzle-orm";


const BASE_URL = "https://apps.ualberta.ca/directory/search/advanced";

// Flow --> Navigate to page --> Find field for depart --> Type department --> Press first reccomendation which should say the department --> Press search 
// --> Pass to cheerio --> Scrape professors 

// Id for the input field DepartmentId-ts-control
export async function filterByDepartment(department: string) {
    let options = new chrome.Options();
    // Remove headless mode temporarily to debug
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();

    try {
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

        const buttons = await driver.findElements(By.css('button'));
        for (let i = 0; i < buttons.length; i++) {
            const buttonText = await buttons[i].getText();
            const buttonType = await buttons[i].getAttribute('type');
        }

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

        console.log("Title:", await driver.getTitle());
        console.log("Current URL:", await driver.getCurrentUrl());

        const pageSource = await driver.getPageSource();
        console.log("Page source length:", pageSource.length, "characters");
        return pageSource;
    } finally {
        await driver.quit();
    }
}

// Get the urls of professor only if they have a rating/page in rate my professor
export async function getRatedProfessors(professors: string[]) {

}


// Gets the current professors from the Database
export async function getDepartmentProfessors(department: string) {
    const profs = await db.select().from(professors).where(eq(professors.department, department));
    return profs;
}




