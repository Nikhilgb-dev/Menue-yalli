import jwt from "jsonwebtoken";
import { AdminAccount } from "../models/AdminAccount.js";
import { Owner } from "../models/Owner.js";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export async function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = jwt.verify(token, getJwtSecret());
    const owner = await Owner.findById(payload.ownerId).select("-passwordHash");

    if (!owner) {
      return response.status(401).json({ message: "Owner account not found." });
    }

    request.owner = owner;
    next();
  } catch (_error) {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
}

export async function requireAdminAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Admin authentication required." });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = jwt.verify(token, getJwtSecret());
    const adminEmail = getAdminEmail();

    if (!adminEmail || payload.role !== "admin" || payload.email !== adminEmail) {
      return response.status(403).json({ message: "Admin access denied." });
    }

    const adminAccount = payload.adminId
      ? await AdminAccount.findById(payload.adminId).select("-passwordHash")
      : await AdminAccount.findOne({ email: adminEmail }).select("-passwordHash");

    if (!adminAccount || adminAccount.email !== adminEmail) {
      return response.status(403).json({ message: "Admin access denied." });
    }

    request.admin = {
      id: adminAccount._id,
      email: adminAccount.email,
      role: "admin"
    };
    next();
  } catch (_error) {
    return response.status(401).json({ message: "Invalid or expired admin token." });
  }
}
