const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const dotenv = require("dotenv");

const rootDir = process.cwd();
const loadedFromFiles = new Set();

for (const envFile of [".env", ".env.local"]) {
  const envPath = path.join(rootDir, envFile);

  if (!fs.existsSync(envPath)) {
    continue;
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined || loadedFromFiles.has(key)) {
      process.env[key] = value;
      loadedFromFiles.add(key);
    }
  }
}

const prismaCliPath = require.resolve("prisma/build/index.js");
const prismaArgs = process.argv.slice(2);

const child = spawn(process.execPath, [prismaCliPath, ...prismaArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
