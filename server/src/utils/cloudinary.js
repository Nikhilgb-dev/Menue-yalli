function requireCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function buildAuthHeader(apiKey, apiSecret) {
  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return `Basic ${token}`;
}

function createPublicId(originalName = "") {
  const baseName = String(originalName)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${Date.now()}-${baseName || "menu-item"}`;
}

export async function uploadImageBuffer(file, options = {}) {
  const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
  const folder = process.env.CLOUDINARY_FOLDER || "menu-platform";
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  const publicId = options.publicId || createPublicId(file.originalname);

  formData.append(
    "file",
    new Blob([file.buffer], {
      type: file.mimetype || "application/octet-stream",
    }),
    file.originalname || "upload",
  );
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("resource_type", "image");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(apiKey, apiSecret),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed.");
  }

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
  };
}

export async function destroyImage(publicId) {
  if (!publicId) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = requireCloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
  const formData = new URLSearchParams();

  formData.set("public_id", publicId);
  formData.set("invalidate", "true");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(apiKey, apiSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary delete failed.");
  }
}
