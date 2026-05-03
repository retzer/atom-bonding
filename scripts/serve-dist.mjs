import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile } from "node:fs/promises";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

createServer(async (request, response) => {
  const cleanPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const filePath = normalize(join(root, cleanPath === "/" ? "index.html" : cleanPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    response.end(data);
  } catch {
    const fallback = await readFile(join(root, "index.html"));
    response.writeHead(200, { "Content-Type": types[".html"] });
    response.end(fallback);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Atom Bonding Studio running at http://127.0.0.1:${port}`);
});
