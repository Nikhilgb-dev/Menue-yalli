import { Router } from "express";
import { getPublicMenu, getQrCode } from "../controllers/publicController.js";

const router = Router();

router.get("/:slug", getPublicMenu);
router.get("/:slug/qr", getQrCode);

export default router;
