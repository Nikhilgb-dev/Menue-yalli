import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDirectory);
  },
  filename: (_request, file, callback) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname) || ".jpg";
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();

    callback(null, `${timestamp}-${safeName}${extension}`);
  }
});

export const upload = multer({ storage });
