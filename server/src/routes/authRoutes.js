import { Router } from "express";
import { adminLogin, login, resetPassword, signup } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/reset-password", resetPassword);

export default router;
