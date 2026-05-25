import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AdminAccount } from "../models/AdminAccount.js";
import { Owner } from "../models/Owner.js";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || "");
}

function buildAdminResponse(adminAccount) {
  return {
    id: adminAccount._id,
    email: adminAccount.email,
    role: "admin"
  };
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

function signAdminToken() {
  const adminEmail = getAdminEmail();

  return jwt.sign(
    {
      role: "admin",
      email: adminEmail
    },
    getJwtSecret(),
    {
      expiresIn: "7d"
    }
  );
}

function signAdminTokenForAccount(adminAccount) {
  return jwt.sign(
    {
      adminId: adminAccount._id.toString(),
      role: "admin",
      email: adminAccount.email
    },
    getJwtSecret(),
    {
      expiresIn: "7d"
    }
  );
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

export async function ensureAdminAccount() {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();

  if (!adminEmail || !adminPassword) {
    return null;
  }

  let adminAccount = await AdminAccount.findOne({ email: adminEmail });

  if (!adminAccount) {
    adminAccount = await AdminAccount.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10)
    });
  }

  return adminAccount;
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

export async function adminLogin(request, response) {
  const { email, password } = request.body;
  const adminAccount = await ensureAdminAccount();

  if (!adminAccount) {
    return response.status(503).json({
      message: "Admin login is not configured on the server."
    });
  }

  if (!email || !password) {
    return response.status(400).json({ message: "Email and password are required." });
  }

  if (email.toLowerCase().trim() !== adminAccount.email) {
    return response.status(401).json({ message: "Invalid admin credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, adminAccount.passwordHash);

  if (!passwordMatches) {
    return response.status(401).json({ message: "Invalid admin credentials." });
  }

  return response.json({
    token: signAdminTokenForAccount(adminAccount),
    admin: buildAdminResponse(adminAccount)
  });
}

export async function resetPassword(request, response) {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({ message: "Email and new password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = String(password);

  if (normalizedPassword.length < 6) {
    return response.status(400).json({
      message: "Password must be at least 6 characters long."
    });
  }

  await ensureAdminAccount();

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  const adminAccount = await AdminAccount.findOneAndUpdate(
    { email: normalizedEmail },
    { passwordHash },
    { new: true }
  );

  if (adminAccount) {
    return response.json({
      message: "Password reset successful.",
      accountType: "admin"
    });
  }

  const owner = await Owner.findOneAndUpdate(
    { email: normalizedEmail },
    { passwordHash },
    { new: true }
  );

  if (!owner) {
    return response.status(404).json({
      message: "No account exists for this email address."
    });
  }

  return response.json({
    message: "Password reset successful.",
    accountType: "owner"
  });
}
