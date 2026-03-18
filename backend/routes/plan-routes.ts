import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPlans, getPlan, createPlan, updatePlan, deletePlan } from "../controllers/plan-controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getPlans);
router.get("/:id", getPlan);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
