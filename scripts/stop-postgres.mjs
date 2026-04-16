import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const composeFile = resolve(rootDir, "docker-compose.yml");
const containerName = "trello-clone-postgres";

if (existsSync(composeFile) && runCommand("docker", ["compose", "version"], { stdio: "ignore" }).ok) {
  process.exit(runCommand("docker", ["compose", "down"], { cwd: rootDir }).status);
}

if (existsSync(composeFile) && runCommand("docker-compose", ["version"], { stdio: "ignore" }).ok) {
  process.exit(runCommand("docker-compose", ["down"], { cwd: rootDir }).status);
}

const stopResult = runCommand("docker", ["stop", containerName]);

if (!stopResult.ok) {
  console.log(`No running container named "${containerName}" was found.`);
}

process.exit(0);

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
  };
}
