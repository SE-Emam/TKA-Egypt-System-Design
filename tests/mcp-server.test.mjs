import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = path.join(root, "mcp", "tka-design-system-server.mjs");

function runMcp(messages) {
  const input = messages.map((message) => JSON.stringify(message)).join("\n") + "\n";
  const result = spawnSync(process.execPath, [server], {
    cwd: root,
    input,
    encoding: "utf8",
    timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim().split("\n").map((line) => JSON.parse(line));
}

test("MCP server initializes and advertises TKA tools", () => {
  const output = runMcp([
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
  ]);
  assert.equal(output[0].result.serverInfo.name, "tka-egypt-design-system");
  const names = output[1].result.tools.map((tool) => tool.name);
  assert.ok(names.includes("tka_get_design_rules"));
  assert.ok(names.includes("tka_read_reference"));
  assert.ok(names.includes("tka_list_logo_assets"));
});

test("brand rules return the approved TKA color anchors", () => {
  const output = runMcp([
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "tka_get_design_rules", arguments: {} } },
  ]);
  const value = JSON.parse(output[0].result.content[0].text);
  assert.equal(value.brand.primaryBlue, "#0846ED");
  assert.equal(value.brand.accentYellow, "#FEB700");
});

test("reference reads reject paths outside the allowlist", () => {
  const output = runMcp([
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "tka_read_reference", arguments: { path: "../../package.json" } } },
  ]);
  assert.equal(output[0].result.isError, true);
  assert.match(output[0].result.content[0].text, /allowlist/i);
});
