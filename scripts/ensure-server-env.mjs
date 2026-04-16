import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const serverDir = resolve(rootDir, "server");
const envPath = resolve(serverDir, ".env");
const envExamplePath = resolve(serverDir, ".env.example");

if (existsSync(envPath)) {
  process.exit(0);
}

if (!existsSync(envExamplePath)) {
  console.error("Missing server/.env.example. Cannot create a default server environment file.");
  process.exit(1);
}

copyFileSync(envExamplePath, envPath);
console.log("Created server/.env from server/.env.example");
