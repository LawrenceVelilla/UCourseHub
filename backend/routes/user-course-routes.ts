import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getUserCourses, addUserCourse, deleteUserCourse } from "../controllers/user-course-controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getUserCourses);
router.post("/", addUserCourse);
router.delete("/:courseCode", deleteUserCourse);

export default router;
