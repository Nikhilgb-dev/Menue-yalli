import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Owner } from "../models/Owner.js";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

function slugifyBusinessName(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function buildUniqueSlug(baseName) {
  const baseSlug = slugifyBusinessName(baseName) || `business-${Date.now()}`;
  let candidate = baseSlug;
  let suffix = 1;

  while (await Owner.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

function signToken(owner) {
  return jwt.sign({ ownerId: owner._id.toString() }, getJwtSecret(), {
    expiresIn: "7d"
  });
}

function buildOwnerResponse(owner) {
  return {
    id: owner._id,
    businessName: owner.businessName,
    businessType: owner.businessType,
    slug: owner.slug,
    email: owner.email,
    phone: owner.phone,
    address: owner.address,
    description: owner.description,
    socialLinks: owner.socialLinks
  };
}

export async function signup(request, response) {
  const { businessName, businessType, email, password } = request.body;

  if (!businessName || !email || !password) {
    return response.status(400).json({
      message: "Business name, email, and password are required."
    });
  }

  const existingOwner = await Owner.findOne({ email: email.toLowerCase().trim() });

  if (existingOwner) {
    return response.status(409).json({ message: "An account already exists for this email." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = await buildUniqueSlug(businessName);

  const owner = await Owner.create({
    businessName: businessName.trim(),
    businessType,
    email: email.toLowerCase().trim(),
    passwordHash,
    slug
  });

  return response.status(201).json({
    token: signToken(owner),
    owner: buildOwnerResponse(owner)
  });
}

export async function login(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({ message: "Email and password are required." });
  }

  const owner = await Owner.findOne({ email: email.toLowerCase().trim() });

  if (!owner) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, owner.passwordHash);

  if (!passwordMatches) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  return response.json({
    token: signToken(owner),
    owner: buildOwnerResponse(owner)
  });
}
