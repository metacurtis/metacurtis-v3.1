/* eslint-disable no-console */
import { spawn } from "node:child_process";
import chokidar from "chokidar";
import fs from "fs/promises";

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", d => out += d.toString());
    p.stderr.on("data", d => err += d.toString());
    p.on("close", code => resolve({ code, out, err }));
  });
}

async function cycle(reason, fileChanged) {
  console.log(`\n🔁 Canon Guard cycle (${reason}${fileChanged ? `: ${fileChanged}` : ""})`);
  await run("node", ["scripts/canon-guard/auto-fix.js"]);
  const res = await run("node", ["scripts/audit-sst-v3-pipeline.js"]);
  console.log(res.out.trim());
  const failed = /❌\s+FAIL/.test(res.out);
  await fs.writeFile("canon-report.txt", res.out);
  await fs.writeFile("canon-report.json", JSON.stringify({ when: Date.now(), failed }, null, 2));
}

async function main() {
  await cycle("startup");
  const watcher = chokidar.watch("src/**/*.{js,jsx,glsl,css}", { ignoreInitial: true });
  watcher.on("change", p => cycle("change", p));
  watcher.on("add", p => cycle("add", p));
  console.log("👀 Canon Guard watching src/…");
}
main();
