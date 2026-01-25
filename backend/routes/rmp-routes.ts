import express from "express";
import * as rmpController from "../controllers/rmp-controller.js";

const router = express.Router();

router.get("/", rmpController.healthCheck);
router.post("/", rmpController.fetchProfessors);

export default router;
