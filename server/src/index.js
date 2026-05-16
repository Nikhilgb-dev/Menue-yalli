import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config({ path: path.resolve("../.env") });
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const clientDistPath = path.resolve("../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasBuiltClient = fs.existsSync(clientIndexPath);

await connectDatabase();

app.use(
  cors({
    origin: clientUrl
  })
);
app.use(express.json());
app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);

if (hasBuiltClient) {
  app.use(express.static(clientDistPath));

  app.get(["/", "/dashboard", "/menu/:slug"], (_request, response) => {
    response.sendFile(clientIndexPath);
  });
}

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
