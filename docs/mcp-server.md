# TKA Egypt Design System MCP Server

A local, read-only Model Context Protocol (MCP) server that exposes the repository's design rules and approved reference documents to compatible AI clients. It uses Node.js built-ins only; no additional package dependency is required.

## Requirements

- Node.js 22+
- A current checkout of this repository
- An MCP-compatible client that supports local stdio servers

## Run

From the repository root:

```sh
npm run mcp:tka
```

The server communicates over standard input/output using newline-delimited JSON-RPC. Do not run it in a terminal session that mixes logs into stdout. Diagnostic messages should go to stderr.

## Configure a compatible client

Use the absolute path to the checked-out repository and the Node executable available to that client. Example configuration shape:

```json
{
  "mcpServers": {
    "tka-design-system": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/TKA-Egypt-System-Design/mcp/tka-design-system-server.mjs"]
    }
  }
}
```

Replace the example path with the real local path. Client configuration formats and locations vary; this is a generic example, not a universal configuration file.

## Tools

- `tka_get_design_rules`: brand anchors, language/direction rules, logo policy, anti-AI-slop restrictions, and reference paths.
- `tka_list_references`: allowlisted canonical source files.
- `tka_read_reference`: read one allowlisted file. Arbitrary paths and path traversal are rejected.
- `tka_list_logo_assets`: discover image files with logo/brand/TKA-like names. Filename matches are hints only; inspect the actual image before deciding it is an official logo.
- `tka_list_image_assets`: list image paths, extensions, and sizes for repository asset discovery.

Canonical references are also exposed as read-only MCP resources under `tka://reference/<repository-relative-path>`.

## Security and scope

- Read-only: no file writes, shell execution, network requests, image generation, or repository mutation.
- Reference reads are restricted to an explicit allowlist.
- Asset discovery skips hidden folders and common generated/dependency directories.
- The MCP server does not claim to visually validate a logo, generate a banner, or run design-system tests. The connected client must use its own design/rendering tools and report what was actually verified.
- Keep the Skill: it gives the agent a workflow; the MCP server gives the agent structured tools and access to reference content. They complement rather than replace each other.

## Smoke test

```sh
printf '%s\\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"1.0"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"tka_get_design_rules","arguments":{}}}' | npm run mcp:tka
```
