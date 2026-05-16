import jwt from "jsonwebtoken";
import { Owner } from "../models/Owner.js";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
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
