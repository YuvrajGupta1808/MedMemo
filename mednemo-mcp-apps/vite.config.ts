import { resolve, dirname, basename } from "path";
import { createLogger, defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const INPUT = process.env.INPUT;
if (!INPUT) {
  throw new Error("INPUT environment variable is not set");
}

const isDevelopment = process.env.NODE_ENV === "development";

// Derive output directory from the input path.
// e.g. src/apps/view-document/index.html → dist/apps/view-document
const inputDir = dirname(INPUT);
const appName = basename(inputDir);
const isAppBuild = inputDir.includes("src/apps/");
const outDir = isAppBuild ? resolve("dist", "apps", appName) : "dist";

const prefixedLogger = createLogger();
for (const level of ["info", "warn", "error"] as const) {
  const fn = prefixedLogger[level];
  prefixedLogger[level] = (msg, opts) =>
    fn(msg.replace(/^/gm, "[vite] "), opts);
}

export default defineConfig({
  customLogger: prefixedLogger,
  plugins: [viteSingleFile()],
  build: {
    sourcemap: isDevelopment ? "inline" : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,
    rollupOptions: {
      input: INPUT,
    },
    outDir,
    emptyOutDir: false,
  },
});
