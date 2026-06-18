# Umhlawati MCP Server

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes your local project to any MCP client over stdio. Every operation is
sandboxed to a single root directory.

## Tools

| Tool                 | Arguments              | Returns                              |
| -------------------- | ---------------------- | ------------------------------------ |
| `list_project_files` | `subPath?`             | All files under the path             |
| `read_project_file`  | `filePath`             | UTF-8 contents (≤ 256 KB)            |
| `search_project`     | `query`                | Matching `file:line: text` (≤ 100)   |

## Install & verify

```bash
cd mcp-server
npm install
npm run smoke      # spawns the server, exercises every tool, checks sandboxing
```

## Wire it into an MCP client (e.g. Claude Code)

Add to your client's MCP config:

```json
{
  "mcpServers": {
    "umhlawati": {
      "command": "node",
      "args": ["/absolute/path/to/umhlawati/mcp-server/server.js"],
      "env": { "MCP_PROJECT_ROOT": "/absolute/path/to/your/project" }
    }
  }
}
```

## Security

- All paths are resolved against `MCP_PROJECT_ROOT`; traversal (`../`) is rejected.
- `node_modules`, `.git`, build output, and caches are never traversed.
- Files larger than 256 KB are refused to keep responses bounded.
