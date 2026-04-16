import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(serverDir, ".env");
const envExamplePath = resolve(serverDir, ".env.example");

dotenv.config({
  path: existsSync(envPath) ? envPath : envExamplePath,
});

export const PORT = Number(process.env.PORT ?? 4000);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? null;
