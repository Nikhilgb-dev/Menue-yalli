import { Router } from "express";
import { getAdminRegistrations } from "../controllers/adminController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAdminAuth);
router.get("/registrations", getAdminRegistrations);

export default router;
