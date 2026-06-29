import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, mkdir, writeFile, cp } from "node:fs/promises";
import { execSync } from "node:child_process";

globalThis.require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.resolve(ROOT, ".vercel/output");

const ESM_BANNER = `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`;

const EXTERNALS = [
  "*.node", "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt",
  "argon2", "fsevents", "re2", "farmhash", "xxhash-addon", "bufferutil",
  "utf-8-validate", "ssh2", "cpu-features", "dtrace-provider", "isolated-vm",
  "lightningcss", "pg-native", "oracledb", "mongodb-client-encryption",
  "nodemailer", "handlebars", "knex", "typeorm", "protobufjs",
  "onnxruntime-node", "@tensorflow/*", "@prisma/client", "@mikro-orm/*",
  "@grpc/*", "@swc/*", "@aws-sdk/*", "@azure/*", "@opentelemetry/*",
  "@google-cloud/*", "@google/*", "googleapis", "firebase-admin",
  "@parcel/watcher", "@sentry/profiling-node", "@tree-sitter/*", "aws-sdk",
  "classic-level", "dd-trace", "ffi-napi", "grpc", "hiredis", "kerberos",
  "leveldown", "miniflare", "mysql2", "newrelic", "odbc", "piscina", "realm",
  "ref-napi", "rocksdb", "sass-embedded", "sequelize", "serialport", "snappy",
  "tinypool", "usb", "workerd", "wrangler", "zeromq", "zeromq-prebuilt",
  "playwright", "puppeteer", "puppeteer-core", "electron",
];

async function main() {
  console.log("=== Vercel Output API Build ===");

  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(OUTPUT, { recursive: true });

  // 1. Build Vite frontend
  console.log("\n[1/3] Building frontend...");
  execSync("pnpm --filter @workspace/kartigo run build", {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, BASE_PATH: "/", PORT: "3000" },
  });

  // 2. Copy static files → .vercel/output/static/
  console.log("\n[2/3] Copying static assets...");
  const staticDir = path.resolve(OUTPUT, "static");
  await mkdir(staticDir, { recursive: true });
  await cp(path.resolve(ROOT, "artifacts/kartigo/dist/public"), staticDir, {
    recursive: true,
  });

  // 3. Build Express API → .vercel/output/functions/api/index.func/
  console.log("\n[3/3] Building API serverless function...");
  const funcDir = path.resolve(OUTPUT, "functions/api/index.func");
  await mkdir(funcDir, { recursive: true });

  await esbuild({
    entryPoints: [{ in: path.resolve(__dirname, "src/app.ts"), out: "index" }],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: funcDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: EXTERNALS,
    sourcemap: false,
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    banner: { js: ESM_BANNER },
    tsconfig: path.resolve(__dirname, "tsconfig.json"),
  });

  // Write Vercel function config
  await writeFile(
    path.resolve(funcDir, ".vc-config.json"),
    JSON.stringify({
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      experimentalResponseStreaming: false,
    }),
  );

  // 4. Write Vercel output routing config
  await writeFile(
    path.resolve(OUTPUT, "config.json"),
    JSON.stringify(
      {
        version: 3,
        routes: [
          { src: "/api/(.*)", dest: "/api/index" },
          { handle: "filesystem" },
          { src: "/(.*)", dest: "/index.html" },
        ],
      },
      null,
      2,
    ),
  );

  console.log("\n✅ Vercel output build complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
