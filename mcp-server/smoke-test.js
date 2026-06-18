/**
 * Smoke test: spawn the server over stdio, list its tools, and exercise each
 * one against this very directory. Exits non-zero on any failure.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

function assert(cond, msg) {
  if (!cond) {
    console.error("ASSERT FAILED:", msg);
    process.exit(1);
  }
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(here, "server.js")],
  env: { ...process.env, MCP_PROJECT_ROOT: here },
});

const client = new Client({ name: "smoke-test", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
console.log("tools:", names.join(", "));
assert(names.includes("list_project_files"), "list_project_files missing");
assert(names.includes("read_project_file"), "read_project_file missing");
assert(names.includes("search_project"), "search_project missing");

const listed = await client.callTool({
  name: "list_project_files",
  arguments: {},
});
assert(listed.content[0].text.includes("server.js"), "list should see server.js");

const read = await client.callTool({
  name: "read_project_file",
  arguments: { filePath: "package.json" },
});
assert(read.content[0].text.includes("umhlawati"), "read should return package.json");

const search = await client.callTool({
  name: "search_project",
  arguments: { query: "registerTool" },
});
assert(search.content[0].text.includes("server.js"), "search should find registerTool");

// Sandbox check: traversal must be rejected.
const escape = await client.callTool({
  name: "read_project_file",
  arguments: { filePath: "../../../etc/passwd" },
});
assert(escape.isError, "traversal outside root must be rejected");

console.log("SMOKE TEST PASSED");
await client.close();
process.exit(0);
