import esbuild from "esbuild";
import { copyFileSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";

const watch = process.argv.includes("--watch");

const common = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: true,
  sourcemap: false,
  target: "es2020",
  treeShaking: true,
};

const formatSize = (bytes) => {
  return `${bytes} bytes (${(bytes / 1024).toFixed(1)}KB)`;
};

const buildOnce = async () => {
  await Promise.all([
    esbuild.build({ ...common, format: "esm", outfile: "dist/index.mjs" }),
    esbuild.build({ ...common, format: "cjs", outfile: "dist/index.js" }),
  ]);

  mkdirSync("dist", { recursive: true });
  copyFileSync(resolve("src/style.css"), resolve("dist/style.css"));

  const esmSize = statSync("dist/index.mjs").size;
  const cjsSize = statSync("dist/index.js").size;
  const cssSize = statSync("dist/style.css").size;

  console.info("> popover-lite built");
  console.info(`  ESM: ${formatSize(esmSize)}`);
  console.info(`  CJS: ${formatSize(cjsSize)}`);
  console.info(`  CSS: ${formatSize(cssSize)}`);
  console.info(`  Total: ${formatSize(esmSize + cssSize)}`);
};

if (watch) {
  esbuild
    .context({ ...common, format: "esm", outfile: "dist/index.mjs" })
    .then((ctx) => ctx.watch());
  esbuild
    .context({ ...common, format: "cjs", outfile: "dist/index.js" })
    .then((ctx) => ctx.watch());
  mkdirSync("dist", { recursive: true });
  copyFileSync(resolve("src/style.css"), resolve("dist/style.css"));
  console.info("> watching for changes…");
} else {
  buildOnce();
}
