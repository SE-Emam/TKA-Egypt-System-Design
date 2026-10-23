#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROTOCOL_VERSION = "2024-11-05";
const ALLOWED_REFERENCES = [
  "AGENTS.md",
  "README.md",
  "docs/brand-and-visual-language.md",
  "docs/anti-ai-slop.md",
  "docs/architecture.md",
  "docs/accessibility-and-quality-gates.md",
  "docs/document-system.md",
  "docs/agent-skill.md",
  "panda.config.ts",
  "skills/tka-design-system/SKILL.md",
];
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]);
const IGNORED_DIRS = new Set([".git", "node_modules", "styled-system", "dist", "coverage"]);

function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

function result(id, content, structuredContent) {
  send({
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: typeof content === "string" ? content : JSON.stringify(content, null, 2) }],
      ...(structuredContent ? { structuredContent } : {}),
    },
  });
}

function rpcError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function toolError(message) {
  return { isError: true, content: [{ type: "text", text: message }] };
}

async function readReference(reference) {
  if (!ALLOWED_REFERENCES.includes(reference)) {
    throw new Error("Reference is not on the allowlist. Use tka_list_references to see permitted paths.");
  }
  return readFile(path.join(ROOT, reference), "utf8");
}

async function findImages(directory = ROOT, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      found.push(...await findImages(path.join(directory, entry.name), path.join(relative, entry.name)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const absolute = path.join(directory, entry.name);
      const info = await stat(absolute);
      found.push({
        path: path.join(relative, entry.name).split(path.sep).join("/"),
        extension: path.extname(entry.name).slice(1).toLowerCase(),
        bytes: info.size,
      });
    }
  }
  return found;
}

const tools = [
  {
    name: "tka_get_design_rules",
    description: "Return the canonical TKA Egypt brand anchors and the governing reference paths. Use these rules before creating or reviewing any TKA design.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "tka_list_references",
    description: "List approved design-system reference files available to this MCP server.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "tka_read_reference",
    description: "Read one allowlisted canonical TKA design reference file. The path must exactly match a path returned by tka_list_references.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", enum: ALLOWED_REFERENCES, description: "Exact allowlisted repository-relative path." } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "tka_list_logo_assets",
    description: "Discover real image assets in the current repository so the agent can choose the official blue or white TKA logo based on contrast. Does not guess filenames or modify assets.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "tka_list_image_assets",
    description: "List repository image assets with their relative paths, formats, and byte sizes. This does not visually verify that an image is a logo.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "tka_get_design_rules":
      return {
        system: "TKA Egypt design-system MCP",
        brand: { primaryBlue: "#0846ED", accentYellow: "#FEB700", supportingColors: ["white", "neutral grays"] },
        language: "Use the language requested by the task. Arabic is RTL-first; English is LTR. Isolate mixed-direction text.",
        logo: "Use a real logo file found in this repository. Preserve its colors and aspect ratio; never redraw, recolor, crop, distort, or add effects. Select blue or white variant by background contrast.",
        antiAiSlop: "Avoid unrequested gradients, glow, glassmorphism, abstract blobs, fake metrics, repetitive feature cards, excessive shadows, oversized pills, and irrelevant stock-like imagery.",
        claims: "Do not invent dates, registration links, phone numbers, accreditation details, prices, or guarantees. Preserve supplied claims without presenting them as independently verified.",
        implementation: "For product UI, use Panda CSS and existing semantic tokens. Do not introduce Tailwind or an unapproved UI library.",
        references: ALLOWED_REFERENCES,
      };
    case "tka_list_references":
      return { references: ALLOWED_REFERENCES };
    case "tka_read_reference":
      if (!args || typeof args.path !== "string") throw new Error("Provide a reference path.");
      return { path: args.path, content: await readReference(args.path) };
    case "tka_list_logo_assets": {
      const images = await findImages();
      return {
        assets: images.filter((item) => /logo|brand|tka/i.test(item.path)),
        note: "Filename matching is discovery only, not proof of logo identity. Inspect the actual image before use.",
      };
    }
    case "tka_list_image_assets":
      return { assets: await findImages(), note: "Image metadata only; visual inspection is still required." };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handle(message) {
  if (!message || message.jsonrpc !== "2.0") return;
  const { id, method, params = {} } = message;
  if (method === "notifications/initialized" || method === "notifications/cancelled") return;
  if (method === "initialize") {
    return send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "tka-egypt-design-system", version: "0.1.0" },
        instructions: "Use tka_get_design_rules first. Read relevant canonical references and discover logo assets before producing a TKA deliverable. This server provides rules and repository discovery, not image generation or visual proofing.",
      },
    });
  }
  if (method === "ping") return send({ jsonrpc: "2.0", id, result: {} });
  if (method === "tools/list") return send({ jsonrpc: "2.0", id, result: { tools } });
  if (method === "resources/list") {
    return send({
      jsonrpc: "2.0",
      id,
      result: {
        resources: ALLOWED_REFERENCES.map((reference) => ({
          uri: `tka://reference/${reference}`,
          name: reference,
          description: "Canonical TKA design-system reference",
          mimeType: "text/markdown",
        })),
      },
    });
  }
  if (method === "resources/read") {
    const uri = params.uri;
    const prefix = "tka://reference/";
    if (typeof uri !== "string" || !uri.startsWith(prefix)) return rpcError(id, -32602, "Unsupported resource URI.");
    const reference = uri.slice(prefix.length);
    try {
      const content = await readReference(reference);
      return send({ jsonrpc: "2.0", id, result: { contents: [{ uri, mimeType: "text/markdown", text: content }] } });
    } catch (error) {
      return rpcError(id, -32602, error.message);
    }
  }
  if (method === "tools/call") {
    try {
      const value = await callTool(params.name, params.arguments ?? {});
      return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value } });
    } catch (error) {
      return send({ jsonrpc: "2.0", id, result: toolError(error.message) });
    }
  }
  if (id !== undefined) rpcError(id, -32601, `Method not found: ${method}`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
  let newline;
  while ((newline = input.indexOf("\n")) !== -1) {
    const line = input.slice(0, newline).trim();
    input = input.slice(newline + 1);
    if (!line) continue;
    try {
      const message = JSON.parse(line);
      Promise.resolve(handle(message)).catch((error) => {
        if (message.id !== undefined) rpcError(message.id, -32603, error.message);
      });
    } catch {
      rpcError(null, -32700, "Parse error");
    }
  }
});
process.stdin.on("end", () => {
  if (input.trim()) {
    try { void handle(JSON.parse(input)); } catch { rpcError(null, -32700, "Parse error"); }
  }
});
