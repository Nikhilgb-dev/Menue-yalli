import { Router } from "express";
import { getPublicMenu, getQrCode, trackSocialClick } from "../controllers/publicController.js";

const router = Router();

router.get("/:slug", getPublicMenu);
router.post("/:slug/social-click", trackSocialClick);
router.get("/:slug/qr", getQrCode);

export default router;
