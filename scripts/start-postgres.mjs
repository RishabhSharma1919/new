import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const composeFile = resolve(rootDir, "docker-compose.yml");
const containerName = "trello-clone-postgres";
const databaseName = "trello_clone";
const databaseUser = "postgres";
const readinessTimeoutMs = 30_000;

if (!runCommand("docker", ["info"], { stdio: "ignore" }).ok) {
  fail("Docker daemon is not running. Start Docker Desktop or your Docker service and retry.");
}

if (existsSync(composeFile) && runCommand("docker", ["compose", "version"], { stdio: "ignore" }).ok) {
  exitIfFailed(runCommand("docker", ["compose", "up", "-d", "postgres"], { cwd: rootDir }));
  waitForPostgres();
  process.exit(0);
}

if (existsSync(composeFile) && runCommand("docker-compose", ["version"], { stdio: "ignore" }).ok) {
  exitIfFailed(runCommand("docker-compose", ["up", "-d", "postgres"], { cwd: rootDir }));
  waitForPostgres();
  process.exit(0);
}

const inspectResult = runCommand("docker", ["container", "inspect", containerName], { stdio: "ignore" });

if (inspectResult.ok) {
  exitIfFailed(runCommand("docker", ["start", containerName]));
  waitForPostgres();
  process.exit(0);
}

exitIfFailed(
  runCommand("docker", [
    "run",
    "--name",
    containerName,
    "-e",
    "POSTGRES_DB=trello_clone",
    "-e",
    "POSTGRES_USER=postgres",
    "-e",
    "POSTGRES_PASSWORD=postgres",
    "-p",
    "5432:5432",
    "-d",
    "postgres:16-alpine",
  ]),
);
waitForPostgres();

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

function exitIfFailed(result) {
  if (!result.ok) {
    process.exit(result.status);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function waitForPostgres() {
  const deadline = Date.now() + readinessTimeoutMs;

  process.stdout.write("Waiting for PostgreSQL to accept connections");

  while (Date.now() < deadline) {
    const isReady = runCommand(
      "docker",
      ["exec", containerName, "pg_isready", "-U", databaseUser, "-d", databaseName],
      { stdio: "ignore" },
    ).ok;

    if (isReady) {
      process.stdout.write(" ready.\n");
      return;
    }

    process.stdout.write(".");
    sleep(1000);
  }

  process.stdout.write("\n");
  fail("PostgreSQL did not become ready in time. Check the container logs and retry.");
}

function sleep(durationMs) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}
