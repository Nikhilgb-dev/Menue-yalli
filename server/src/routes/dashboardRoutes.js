import { Router } from "express";
import {
  deleteAccount,
  getDashboard,
  updateProfile
} from "../controllers/dashboardController.js";
import {
  createMenuItem,
  deleteMenuItem,
  updateMenuItem
} from "../controllers/menuItemController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

router.use(requireAuth);
router.get("/", getDashboard);
router.put("/profile", updateProfile);
router.delete("/account", deleteAccount);
router.post(
  "/menu-items",
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "image", maxCount: 1 }
  ]),
  createMenuItem
);
router.put("/menu-items/:itemId", upload.single("image"), updateMenuItem);
router.delete("/menu-items/:itemId", deleteMenuItem);

export default router;
