import { MenuItem } from "../models/MenuItem.js";
import { destroyImage, uploadImageBuffer } from "../utils/cloudinary.js";

function buildImageUrl(request, imagePath) {
  if (/^https?:\/\//i.test(String(imagePath || ""))) {
    return imagePath;
  }

  return `${request.protocol}://${request.get("host")}${imagePath}`;
}

function getUploadedImages(request) {
  if (!request.files) {
    return [];
  }

  if (Array.isArray(request.files)) {
    return request.files;
  }

  return [...(request.files.images || []), ...(request.files.image || [])];
}

function normalizeAvailable(value) {
  if (value === false || value === "false") {
    return false;
  }

  return true;
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  return category.toLowerCase() === "menu" ? "" : category;
}

export async function createMenuItem(request, response) {
  const uploadedImages = getUploadedImages(request);

  if (request.body.items) {
    let parsedItems = [];
    let uploadedAssets = [];

    try {
      parsedItems = JSON.parse(request.body.items);
    } catch (_error) {
      return response.status(400).json({ message: "Menu items payload is invalid." });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return response.status(400).json({ message: "At least one menu item is required." });
    }

    try {
      const itemsToCreate = parsedItems.map((item, index) => {
        const name = String(item?.name || "").trim();
        const description = String(item?.description || "").trim();
        const price = Number(item?.price);
        const imageIndex = Number(item?.imageIndex);
        const image = uploadedImages[imageIndex];

        if (!name || Number.isNaN(price)) {
          throw new Error(`Item ${index + 1} must include a valid name and price.`);
        }

        if (!image) {
          throw new Error(`Item ${index + 1} must include an image.`);
        }

        return {
          ownerId: request.owner._id,
          name,
          category: normalizeCategory(item?.category),
          description,
          price,
          available: normalizeAvailable(item?.available),
          imagePath: `/uploads/${image.filename}`
        };
      });

      uploadedAssets = await Promise.all(
        itemsToCreate.map((item, index) => uploadImageBuffer(uploadedImages[index]))
      );

      const createdItems = await MenuItem.insertMany(
        itemsToCreate.map((item, index) => ({
          ...item,
          imagePath: uploadedAssets[index].secureUrl,
          imagePublicId: uploadedAssets[index].publicId
        }))
      );

      return response.status(201).json({
        items: createdItems.map((item) => ({
          id: item._id,
          name: item.name,
          category: normalizeCategory(item.category),
          description: item.description,
          price: item.price,
          available: item.available,
          imageUrl: buildImageUrl(request, item.imagePath)
        }))
      });
    } catch (error) {
      await Promise.all(
        uploadedAssets.map((asset) =>
          asset?.publicId ? destroyImage(asset.publicId).catch(() => undefined) : undefined
        )
      );

      return response.status(400).json({ message: error.message });
    }
  }

  const { name, category, description, price, available } = request.body;
  const image = uploadedImages[0];

  if (!name || price === undefined) {
    return response.status(400).json({ message: "Name and price are required." });
  }

  if (!image) {
    return response.status(400).json({ message: "An image is required for each menu item." });
  }

  const uploadedAsset = await uploadImageBuffer(image);

  const menuItem = await MenuItem.create({
    ownerId: request.owner._id,
    name: String(name).trim(),
    category: normalizeCategory(category),
    description: String(description || "").trim(),
    price: Number(price),
    available: normalizeAvailable(available),
    imagePath: uploadedAsset.secureUrl,
    imagePublicId: uploadedAsset.publicId
  });

  return response.status(201).json({
    item: {
      id: menuItem._id,
      name: menuItem.name,
      category: normalizeCategory(menuItem.category),
      description: menuItem.description,
      price: menuItem.price,
      available: menuItem.available,
      imageUrl: buildImageUrl(request, menuItem.imagePath)
    }
  });
}

export async function updateMenuItem(request, response) {
  const existingItem = await MenuItem.findOne({
    _id: request.params.itemId,
    ownerId: request.owner._id
  });

  if (!existingItem) {
    return response.status(404).json({ message: "Menu item not found." });
  }

  const { name, category, description, price, available } = request.body;

  if (name !== undefined) {
    existingItem.name = String(name).trim();
  }

  if (description !== undefined) {
    existingItem.description = String(description).trim();
  }

  if (category !== undefined) {
    existingItem.category = normalizeCategory(category);
  }

  if (price !== undefined) {
    existingItem.price = Number(price);
  }

  if (available !== undefined) {
    existingItem.available = available === "false" ? false : Boolean(available);
  }

  if (request.file) {
    const uploadedAsset = await uploadImageBuffer(request.file);

    if (existingItem.imagePublicId) {
      await destroyImage(existingItem.imagePublicId);
    }

    existingItem.imagePath = uploadedAsset.secureUrl;
    existingItem.imagePublicId = uploadedAsset.publicId;
  }

  await existingItem.save();

  return response.json({
    item: {
      id: existingItem._id,
      name: existingItem.name,
      category: normalizeCategory(existingItem.category),
      description: existingItem.description,
      price: existingItem.price,
      available: existingItem.available,
      imageUrl: buildImageUrl(request, existingItem.imagePath)
    }
  });
}

export async function deleteMenuItem(request, response) {
  const deletedItem = await MenuItem.findOneAndDelete({
    _id: request.params.itemId,
    ownerId: request.owner._id
  });

  if (!deletedItem) {
    return response.status(404).json({ message: "Menu item not found." });
  }

  if (deletedItem.imagePublicId) {
    await destroyImage(deletedItem.imagePublicId);
  }

  return response.status(204).send();
}
