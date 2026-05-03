import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const srcPath = path.join(rootPath, "src");
const distPath = path.join(rootPath, "dist");
const assetsPath = path.join(distPath, "assets");
const outSrcPath = path.join(assetsPath, "src");

await rm(distPath, { recursive: true, force: true });
await mkdir(outSrcPath, { recursive: true });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function browserImports(code) {
  return code.replace(/(from\s+["'])(\.[^"']+?)(["'])/g, (match, start, specifier, end) => {
    if (path.extname(specifier)) return match;
    return `${start}${specifier}.js${end}`;
  }).replace(/(import\s+["'])(\.[^"']+?)(["'])/g, (match, start, specifier, end) => {
    if (path.extname(specifier)) return match;
    return `${start}${specifier}.js${end}`;
  });
}

for (const file of await walk(srcPath)) {
  const relative = path.relative(srcPath, file);
  const outFile = path.join(outSrcPath, relative).replace(/\.(ts|tsx)$/, ".js");
  await mkdir(path.dirname(outFile), { recursive: true });
  const source = (await readFile(file, "utf8")).replace(/^\s*import\s+["']\.\/styles\.css["'];\s*$/m, "");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
    },
    fileName: file
  });
  await writeFile(outFile, browserImports(transpiled.outputText), "utf8");
}

const importMap = `    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.0.0",
          "react/jsx-runtime": "https://esm.sh/react@19.0.0/jsx-runtime",
          "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
          "lucide-react": "https://esm.sh/lucide-react@0.468.0?deps=react@19.0.0"
        }
      }
    </script>`;

let html = await readFile(path.join(rootPath, "index.html"), "utf8");
html = html.replace(/\s*<script data-file-redirect>[\s\S]*?<\/script>/, "");
html = html.replace('<link rel="stylesheet" href="/src/styles.css" />', '<link rel="stylesheet" href="./assets/styles.css" />');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', `${importMap}\n    <script type="module" src="./assets/src/main.js"></script>`);
await writeFile(path.join(distPath, "index.html"), html, "utf8");
