# wb-convo-flow · Conversation Flow Studio for WorkBuddy

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A WorkBuddy plugin: when you open a workspace, **every conversation automatically appears on the canvas as a node card in one of three sizes**; **double-click a node to open the full conversation** in a modal reader; then **chain conversations into a complete visual workflow** using port dragging or click-to-connect.

> The interaction is inspired by Langflow and Dify (both built on the same `@xyflow/react` / React Flow engine) — but the nodes here are your **real, existing conversations**. 中文说明见 [README.md](./README.md).

## Features

| Module | Description |
|--------|-------------|
| 🗂 Workspace sidebar | Auto-discovers all local WorkBuddy workspaces (`~/.workbuddy/projects`) with paths and conversation counts |
| 🎨 Canvas orchestration | Conversations auto-laid-out on entry; cards sized **S / M / L** by message count in a snake grid; zoom, pan, minimap, fit-view, marquee selection |
| 🏷 Node cards | Title + message count + last-updated + two-line excerpt of the first user prompt; quick actions: open / connect / delete |
| 🔗 Two ways to connect | ① Drag from a node's right port to the next node; ② click "Connect→" then click the target. Duplicate and cycle detection built in |
| 🔍 Modal reader | Double-click a node to read the full conversation (role bubbles / model / timestamps); jump to prev/next connected node; `Esc` to close |
| 🗃 Multiple flows | Named workflows per workspace; auto-draft 0.8s after edits, explicit "Save" for a release version; rename / delete / export JSON |
| ⏪ Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` covering move / connect / delete / layout actions |
| 📋 List mode | The classic tabbed conversation browser, one click away |

## Quick Start

```bash
git clone https://github.com/LinZhaorui/wb-convo-flow.git wb-convo-flow
cd wb-convo-flow
npm install
npm run build
npm start          # open http://127.0.0.1:3457
```

Development (hot reload):

```bash
npm run server     # terminal 1: API server (3457)
npm run dev        # terminal 2: Vite dev server (5173, /api proxied)
```

## WorkBuddy Plugin Integration (MCP)

Add to the `mcpServers` section of `~/.workbuddy/mcp.json` (do not overwrite existing entries):

```json
{
  "mcpServers": {
    "wb-convo-flow": {
      "command": "node",
      "args": ["<absolute-path-to-this-repo>/server/mcp-server.js"]
    }
  }
}
```

Then trust the connector in WorkBuddy's connector management page. Available tools:

- `open_flow_studio` — starts the local server (if needed) and returns the studio URL
- `list_workspaces` — lists local workspaces with conversation counts

## Interaction Cheat Sheet

| Action | How |
|--------|-----|
| Lay out all conversations | Automatic on entering canvas mode; use "Re-layout" to add missing ones |
| Select a node | Single click |
| Open a conversation | Double-click the node or its "Open" button |
| Connect by dragging | Drag from a node's right port to the target's left port |
| Connect by clicking | Click "Connect→" on a card, then click the target (`Esc` cancels) |
| Delete node / edge | Card "Delete" button, or select + `Delete` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Zoom / pan | Mouse wheel / drag empty canvas; navigate via Minimap |

> Note: conversations open in **read-only** mode. Continuing a conversation programmatically requires a session API from WorkBuddy, which is tracked on the roadmap.

## Workflow Data

- Storage: `~/.workbuddy/projects/<workspace>/wb-convo-flows/<flowId>.json`
- Shape: `{ name, nodes, edges, viewport, draft, updatedAt, savedAt }`
- `draft: true` marks an auto-saved draft; `savedAt` is the last explicit save time
- Legacy single-file `wb-convo-flow.json` migrates automatically into a "默认工作流" on first access
- The "Export" button downloads the current flow as JSON for sharing/backup

See [docs/architecture.md](./docs/architecture.md) for the full data contract and API reference, and [docs/interaction.md](./docs/interaction.md) for interaction design rules.

## Roadmap

- [ ] **Flow execution**: replay conversations in topological order (requires a WorkBuddy session API)
- [ ] More node types: condition branches, sticky notes, external tools (declarative metadata registry)
- [ ] Persisted undo history and flow version snapshots
- [ ] Flow import (dual of export) and cross-workspace copy
- [ ] Paged loading for very large conversations (>5MB jsonl)

## License

[MIT](./LICENSE)
