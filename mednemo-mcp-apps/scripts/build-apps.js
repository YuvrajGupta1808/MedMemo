#!/usr/bin/env node
/**
 * Build each MCP App HTML entry point into a single self-contained HTML file
 * using Vite + vite-plugin-singlefile (matching mcp-app-studio pattern).
 */
import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const appsDir = resolve(projectRoot, "src", "apps");

// Find all app directories that have an index.html
const apps = readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => existsSync(resolve(appsDir, d.name, "index.html")))
  .map((d) => d.name);

console.log(`Building ${apps.length} MCP apps: ${apps.join(", ")}`);

for (const app of apps) {
  const input = resolve(appsDir, app, "index.html");
  console.log(`\n📦 Building: ${app}`);
  try {
    execSync(`npx vite build`, {
      cwd: projectRoot,
      env: { ...process.env, INPUT: input },
      stdio: "inherit",
    });
  } catch (err) {
    console.error(`❌ Failed to build ${app}`);
    process.exit(1);
  }
}

console.log(`\n✅ All ${apps.length} apps built successfully.`);
