/* eslint-env node */
/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry") || process.argv.includes("--dry-run");
const AGGRESSIVE = process.argv.includes("--aggressive-bg");

const FILES = {
  webglCanvas: [
    "src/components/webgl/WebGLCanvas.jsx",
    "src/components/WebGLCanvas.jsx",
  ],
  entryPoints: [
    "src/main.jsx",
    "src/main.tsx",
    "src/index.jsx",
    "src/index.tsx",
  ],
  // Prefer your existing styles/index.css first
  cssCandidates: [
    "src/styles/index.css",
    "src/styles/main.css",
    "src/styles/global.css",
    "src/index.css",
    "src/global.css",
    "src/styles.css",
    "src/app.css",
    "src/main.css",
  ],
  bgCandidates: [
    "src/components/consciousness/ConsciousnessTheater.jsx",
    "src/components/ui/Layout.jsx",
    "src/App.jsx",
  ],
};

const CSS_BASE = `/* Auto-added viewport/base styles */
html, body, #root { height: 100%; margin: 0; background: #000; }
canvas { display: block; }
`;

function stamp(){return new Date().toISOString().replace(/[:.]/g,"-");}
async function exists(p){try{await fs.access(p);return true;}catch{return false;}}
async function backup(file){const bak=`${file}.bak.viewport-${stamp()}`;if(!DRY){await fs.writeFile(bak,await fs.readFile(file,"utf8"));}return bak;}
function replaceOnce(s,re,r){const out=s.replace(re,r);return out===s?null:out;}

async function patchWebGLCanvas(){
  let file=null;
  for(const c of FILES.webglCanvas){const f=path.join(ROOT,c); if(await exists(f)){file=f;break;}}
  if(!file) return {status:"skip",reason:"WebGLCanvas.jsx not found"};

  let src=await fs.readFile(file,"utf8"); const orig=src; let changed=false;

  // Force wrapper to fixed full-viewport
  let n=replaceOnce(src,/<div\s+className=(["'])fixed\s+inset-0\s+w-full\s+h-full\1\s*>/,
    `<div style={{ position:'fixed', inset:0, width:'100vw', height:'100vh', zIndex:0 }}>`);
  if(n){src=n; changed=true;}

  // If wrapper exists but without style, inject
  if(!changed && /return\s*\(\s*<div[^>]*>/.test(src) && !/style=\{/.test(src.match(/return\s*\(\s*<div[^>]*>/)?.[0]||"")){
    n=replaceOnce(src,/(return\s*\(\s*)<div([^>]*)>/,
      (_,pre,rest)=>`${pre}<div${rest} style={{ position:'fixed', inset:0, width:'100vw', height:'100vh', zIndex:0 }}>`);
    if(n){src=n; changed=true;}
  }

  // Ensure <Canvas> fills wrapper
  if(!/\<Canvas[^>]*style=\{/.test(src)){
    n=replaceOnce(src,/<Canvas(\s+)/, `<Canvas style={{ display:'block', width:'100%', height:'100%' }}$1`);
    if(n){src=n; changed=true;}
  }

  if(!changed) return {status:"noop",file};
  if(!DRY){await backup(file); await fs.writeFile(file,src,"utf8");}
  return {status:"changed",file};
}

async function ensureBaseCSS(){
  let target=null;
  for(const c of FILES.cssCandidates){const f=path.join(ROOT,c); if(await exists(f)){target=f;break;}}
  if(!target){ // create preferred path
    target=path.join(ROOT,FILES.cssCandidates[0]);
    if(!DRY){await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,CSS_BASE,"utf8");}
    return {status:"created",file:target};
  }
  const css=await fs.readFile(target,"utf8");
  const hasHeight=/html,\s*body,\s*#root\s*\{[^}]*height:\s*100%/m.test(css);
  const hasCanvas=/canvas\s*\{[^}]*display:\s*block/m.test(css);
  if(hasHeight && hasCanvas) return {status:"ok",file:target};
  if(!DRY){await fs.appendFile(target,(css.endsWith("\n")?"":"\n")+CSS_BASE,"utf8");}
  return {status:"patched",file:target};
}

async function ensureCssImport(cssPath){
  let entry=null;
  for(const c of FILES.entryPoints){const f=path.join(ROOT,c); if(await exists(f)){entry=f;break;}}
  if(!entry) return {status:"skip",reason:"entry file not found"};

  const code=await fs.readFile(entry,"utf8");
  const rel="./"+path.relative(path.dirname(entry), cssPath).replace(/\\/g,"/");
  if(new RegExp(`import\\s+['"]${rel.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}['"];?`).test(code))
    return {status:"ok",file:entry};

  if(!DRY){await backup(entry); await fs.writeFile(entry,`import '${rel}';\n${code}`,"utf8");}
  return {status:"patched",file:entry};
}

async function stripBackgrounds(){
  if(!AGGRESSIVE) return {status:"skipped",reason:"--aggressive-bg not set"};
  const tailwindBg=/\bbg-(?:black|slate-\d{3}|stone-\d{3}|zinc-\d{3}|gray-\d{3}|neutral-\d{3}|.+?)(?=\b)/g;

  let edits=0, files=[];
  for(const c of FILES.bgCandidates){
    const f=path.join(ROOT,c); if(!(await exists(f))) continue;
    let s=await fs.readFile(f,"utf8"); const orig=s;
    s=s.replace(tailwindBg, "bg-transparent");
    if(s!==orig){ if(!DRY){await backup(f); await fs.writeFile(f,s,"utf8");} edits++; files.push(f); }
  }
  return edits?{status:`cleaned ${edits}`,files}:{status:"noop-bg"};
}

(async ()=>{
  console.log(`\nFull-Viewport Canvas Fix ${DRY?"(dry run)":""}`);
  console.log(`Project: ${ROOT}\n`);

  const r1 = await patchWebGLCanvas();
  const r2 = await ensureBaseCSS();

  const cssPath = r2.file || path.join(ROOT, FILES.cssCandidates[0]);
  const r3 = await ensureCssImport(cssPath);
  const r4 = await stripBackgrounds();

  const pr = r => {
    if(r.reason) return `• ${r.reason}`;
    if(r.files) return `• ${r.status}: \n  - ${r.files.join("\n  - ")}`;
    return `• ${r.file||""} — ${r.status}`;
  };

  console.log(pr(r1));
  console.log(pr(r2));
  console.log(pr(r3));
  console.log(pr(r4));

  if(!DRY) console.log(`\nBackups use ".bak.viewport-${stamp()}".`);
  console.log("\nDone.\n");
})().catch(e=>{console.error(e);process.exit(1);});
