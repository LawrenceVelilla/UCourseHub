import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { scrapeAndSaveDepartmentCourses } from '../services/course-service.js';
import { fullProfessorSync } from '../services/professor-sync-service.js';
import { syncProfessorsToCourses } from '../services/professor-course-service.js';
import { fetchProfessors } from '../scrapers/prof-catalogue.js';
import { scrapeRedditForDepartment, scrapeRedditForCourse } from '../services/reddit-service.js';
import { getProfessor, bulkSaveProfessors } from '../services/rmp-service.js';
dotenv.config();


const UALBERTA_SCHOOL_ID = "U2Nob29sLTE0MDc=";

async function main() {
    console.clear();
    console.log(chalk.cyan.bold('\nUCourseHub Data CLI\n'));

    while (true) {
        const action = await select({
            message: 'What would you like to do?',
            choices: [
                { name: 'Scrape Courses', value: 'courses' },
                { name: 'Scrape Professors', value: 'professors' },
                { name: 'Scrape Reddit', value: 'reddit' },
                { name: 'Generate Embeddings (RAG)', value: 'embeddings' },
                { name: chalk.red('Exit'), value: 'exit' },
            ],
        });

        if (action === 'exit') {
            console.log(chalk.gray('\nGoodbye!\n'));
            process.exit(0);
        }

        try {
            switch (action) {
                case 'courses':
                    await handleCourses();
                    break;
                case 'professors':
                    await handleProfessors();
                    break;
                case 'reddit':
                    await handleReddit();
                    break;
                case 'embeddings':
                    await handleEmbeddings();
                    break;
            }
        } catch (error) {
            console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : error);
        }

        console.log(''); // spacing
    }
}

async function handleCourses() {
    const department = await input({
        message: 'Department code (e.g., CMPUT, MATH):',
        validate: (v) => v.length > 0 || 'Department is required',
    });

    const fromStr = await input({
        message: 'Start index (default: 0):',
        default: '0',
    });

    const toStr = await input({
        message: 'End index (default: all):',
        default: '-1',
    });

    const from = parseInt(fromStr) || 0;
    const to = parseInt(toStr) || -1;

    const spinner = ora(`Scraping courses for ${department}...`).start();

    try {
        const count = await scrapeAndSaveDepartmentCourses(department, from, to, (msg) => {
            spinner.text = msg;
        });
        spinner.succeed(chalk.green(`✓ Saved ${count} courses for ${department}`));
    } catch (error) {
        spinner.fail(chalk.red('Failed to scrape courses'));
        throw error;
    }
}

async function handleProfessors() {
    const mode = await select({
        message: 'Select sync mode:',
        choices: [
            {
                name: 'Full Sync (RMP + UAlberta + Link to Courses)',
                value: 'full',
                description: 'Scrapes RMP, then UAlberta directory, matches & links to courses'
            },
            {
                name: 'Regular Sync (UAlberta + Link to Courses)',
                value: 'regular',
                description: 'Assumes RMP data exists, just syncs UAlberta profs to courses'
            },
            {
                name: 'RMP Only (Scrape & Save RMP Data)',
                value: 'rmp-only',
                description: 'Only scrapes and saves RateMyProfessors data'
            },
            { name: chalk.gray('← Back'), value: 'back' },
        ],
    });

    if (mode === 'back') return;

    const department = await input({
        message: 'UAlberta Department (e.g., Computing Science, Psychology):',
        validate: (v) => v.length > 0 || 'Department is required',
    });

    if (mode === 'full') {
        const rmpDeptId = await input({
            message: 'RMP Department ID (optional, press Enter to skip):',
            default: '',
        });

        const schoolId = await input({
            message: 'School ID (default: UAlberta):',
            default: UALBERTA_SCHOOL_ID,
        });

        const spinner = ora(`Running full professor sync for ${department}...`).start();

        try {
            const summary = await fullProfessorSync(department, schoolId, rmpDeptId);
            spinner.succeed(chalk.green('Full sync completed!'));

            console.log(chalk.cyan('\n📊 Summary:'));
            console.log(`   RMP Scraped: ${summary.rmpScraped}`);
            console.log(`   RMP Saved: ${summary.rmpSaved}`);
            console.log(`   UAlberta Scraped: ${summary.ualbertaScraped}`);
            console.log(`   Matched to RMP: ${summary.matchedToRMP}`);
            console.log(`   New Professors: ${summary.newProfessors}`);
            console.log(`   Courses Linked: ${summary.coursesLinked}`);
            console.log(`   Courses Failed: ${summary.coursesFailed}`);

            if (summary.errors.length > 0) {
                console.log(chalk.yellow(`\nErrors (${summary.errors.length}):`));
                summary.errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
                if (summary.errors.length > 5) {
                    console.log(chalk.gray(`   ... and ${summary.errors.length - 5} more`));
                }
            }
        } catch (error) {
            spinner.fail(chalk.red('Full sync failed'));
            throw error;
        }

    } else if (mode === 'regular') {
        const spinner = ora(`Syncing professors for ${department}...`).start();

        try {
            const scrapedProfs = await fetchProfessors(department);
            spinner.text = `Found ${scrapedProfs.length} professors, linking to courses...`;

            const summary = await syncProfessorsToCourses(scrapedProfs, department);
            spinner.succeed(chalk.green('Regular sync completed!'));

            console.log(chalk.cyan('\nSummary:'));
            console.log(`   Total Scraped: ${summary.totalScraped}`);
            console.log(`   Matched: ${summary.matched}`);
            console.log(`   New Professors: ${summary.newProfessors}`);
            console.log(`   Courses Linked: ${summary.coursesLinked}`);
            console.log(`   Courses Failed: ${summary.coursesFailed}`);
        } catch (error) {
            spinner.fail(chalk.red('Regular sync failed'));
            throw error;
        }

    } else if (mode === 'rmp-only') {
        const rmpDeptId = await input({
            message: 'RMP Department ID (optional):',
            default: '',
        });

        const spinner = ora(`Scraping RMP for ${department}...`).start();

        try {
            const professors = await getProfessor(UALBERTA_SCHOOL_ID, department, rmpDeptId);
            spinner.text = `Found ${professors.length} professors, saving...`;

            const saved = await bulkSaveProfessors(professors);
            spinner.succeed(chalk.green(`Saved ${saved} professors from RMP`));
        } catch (error) {
            spinner.fail(chalk.red('RMP scrape failed'));
            throw error;
        }
    }
}

async function handleReddit() {
    const mode = await select({
        message: 'Select scraping mode:',
        choices: [
            {
                name: 'Department Scrape',
                value: 'department',
                description: 'Scrapes all Reddit posts mentioning the department'
            },
            {
                name: 'Course Title Search',
                value: 'course-title',
                description: 'Searches for posts with course code in the title'
            },
            {
                name: 'Course Text Search',
                value: 'course-text',
                description: 'Searches for posts mentioning course code anywhere'
            },
            { name: chalk.gray('← Back'), value: 'back' },
        ],
    });

    if (mode === 'back') return;

    if (mode === 'department') {
        const department = await input({
            message: 'Department code (e.g., CMPUT, MATH):',
            validate: (v) => v.length > 0 || 'Department is required',
        });

        const spinner = ora(`Scraping Reddit for ${department}...`).start();

        try {
            const result = await scrapeRedditForDepartment(department);
            spinner.succeed(chalk.green('Reddit scrape completed!'));

            console.log(chalk.cyan('\nSummary:'));
            console.log(`   Posts Scraped: ${result.postsScraped}`);
            console.log(`   New Posts: ${result.postsNew}`);
            console.log(`   Posts Saved: ${result.postsSaved}`);
            console.log(`   Comments Saved: ${result.commentsSaved}`);
            console.log(`   Courses Linked: ${result.coursesLinked}`);

            if (result.errors.length > 0) {
                console.log(chalk.yellow(`\nErrors (${result.errors.length}):`));
                result.errors.slice(0, 3).forEach(e => console.log(`   - ${e}`));
            }
        } catch (error) {
            spinner.fail(chalk.red('Reddit scrape failed'));
            throw error;
        }

    } else if (mode === 'course-title' || mode === 'course-text') {
        const courseCode = await input({
            message: 'Course code (e.g., CMPUT 291):',
            validate: (v) => v.length > 0 || 'Course code is required',
        });

        const maxPagesStr = await input({
            message: 'Max pages to scrape (default: 2):',
            default: '2',
        });

        const maxPages = parseInt(maxPagesStr) || 2;
        const spinner = ora(`Scraping Reddit for ${courseCode}...`).start();

        try {
            const result = await scrapeRedditForCourse(courseCode, maxPages);
            spinner.succeed(chalk.green('Reddit scrape completed!'));

            console.log(chalk.cyan('\n📊 Summary:'));
            console.log(`   Posts Scraped: ${result.postsScraped}`);
            console.log(`   New Posts: ${result.postsNew}`);
            console.log(`   Posts Saved: ${result.postsSaved}`);
            console.log(`   Comments Saved: ${result.commentsSaved}`);
            console.log(`   Courses Linked: ${result.coursesLinked}`);
        } catch (error) {
            spinner.fail(chalk.red('Reddit scrape failed'));
            throw error;
        }
    }
}

async function handleEmbeddings() {
    console.log(chalk.yellow('\nEmbeddings generation coming soon!\n'));
    console.log(chalk.gray('This will:'));
    console.log(chalk.gray('  - Fetch course data + professors + reddit discussions'));
    console.log(chalk.gray('  - Format for embedding'));
    console.log(chalk.gray('  - Generate embeddings via OpenAI'));
    console.log(chalk.gray('  - Store in Pinecone/pgvector'));

    await confirm({ message: 'Press Enter to continue...', default: true });
}

main().catch(console.error);
