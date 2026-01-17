import express from "express";
import * as rmpController from "../../backend/controllers/rmp-controller";

const router = express.Router();

router.get("/", rmpController.healthCheck);
router.post("/", rmpController.fetchProfessors);

export default router;
