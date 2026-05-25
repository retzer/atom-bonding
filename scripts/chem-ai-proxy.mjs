import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, ".chem-ai-cache");
const originalEnvKeys = new Set(Object.keys(process.env));
await loadEnvFile(".env");
await loadEnvFile(".env.local", true);
const port = Number(process.env.CHEM_AI_PORT || 8787);
const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

const server = createServer(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/chem-ai") {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found.");
    return;
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("DeepSeek API key is not set. Set DEEPSEEK_API_KEY before starting the chemistry AI helper.");
      return;
    }

    const payload = JSON.parse(await readBody(request));
    const cacheKey = hashKey(payload.cacheKey || JSON.stringify(payload));
    const cached = await readCache(cacheKey);
    if (cached) {
      sendJson(response, { ...cached, cached: true });
      return;
    }

    const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.18,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a chemistry explainer for an educational molecule analysis tool. Return strict JSON with keys summary, takeaways, caveats. Keep it concise, chemically careful, and avoid medical or safety claims."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: payload.task || "Explain the molecule using the local analysis and PubChem descriptors. Bridge beginner intuition with college-level chemistry in one compact response.",
              molecule: payload.molecule,
              selection: payload.selection,
              localAnalysis: payload.localAnalysis,
              descriptors: payload.descriptors,
              sourcePolicy: "Use PubChem identifiers such as CID, SMILES, InChI/InChIKey, exact mass, XLogP, TPSA, hydrogen-bond counts, formal charge, complexity, and synonyms when they are supplied. Mention uncertainty when a descriptor is missing or locally estimated. Do not describe every carbon as tetrahedral: use the supplied geometry and functional-group signals. Carbonyl/aldehyde carbons are planar sp2, while saturated alcohol-bearing carbons are usually sp3. If the local visualization is simplified, state that plainly."
            })
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      response.writeHead(502, { "Content-Type": "text/plain" });
      response.end(text || `DeepSeek request failed with ${aiResponse.status}.`);
      return;
    }

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = normalizeInsight(content, model);
    await writeCache(cacheKey, parsed);
    sendJson(response, { ...parsed, cached: false });
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end(error instanceof Error ? error.message : "Chemistry AI helper failed.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Chemistry AI helper listening on http://127.0.0.1:${port}/api/chem-ai`);
});

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, value) {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function hashKey(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

async function readCache(key) {
  try {
    return JSON.parse(await readFile(join(cacheDir, `${key}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(join(cacheDir, `${key}.json`), JSON.stringify(value, null, 2), "utf8");
}

function normalizeInsight(content, modelName) {
  let parsed = {};
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content ?? {};
  } catch {
    parsed = { summary: String(content || "No AI summary was returned.") };
  }
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "No AI summary was returned.",
    takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways.map(String).slice(0, 6) : [],
    caveats: Array.isArray(parsed.caveats) ? parsed.caveats.map(String).slice(0, 4) : [],
    model: modelName,
    generatedAt: Date.now()
  };
}

async function loadEnvFile(name, allowLocalOverride = false) {
  const file = join(root, name);
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    return;
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals < 1) continue;
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (originalEnvKeys.has(key)) continue;
    if (!allowLocalOverride && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}
