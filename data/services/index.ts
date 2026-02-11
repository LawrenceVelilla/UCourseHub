// Types
export * from './types.js';

// Course services
export {
    processCourse,
    processDepartment,
    saveCourse,
    scrapeDepartmentCourses,
    scrapeAndSaveDepartmentCourses,
} from './course-service.js';

// Reddit services
export {
    scrapeRedditForDepartment,
    scrapeRedditForCourse,
    getDiscussionsByCourseId,
} from './reddit-service.js';

// Professor services
export {
    findMatchingProfessor,
    findCourseByCode,
    saveProfessorCourse,
    linkProfessorToCourses,
    createProfessorWithoutRMP,
    processProfessor,
    syncProfessorsToCourses,
} from './professor-course-service.js';

// RMP services
export {
    getProfessor,
    bulkSaveProfessors,
} from './rmp-service.js';

// Full sync
export { fullProfessorSync } from './professor-sync-service.js';
