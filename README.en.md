# wb-convo-flow · Conversation Flow Studio for WorkBuddy

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A WorkBuddy plugin: pick a workspace and **every conversation lands on the canvas as a node card in one of three sizes**; click to select, **double-click to open the full conversation**; then **chain conversations into a complete visual workflow** — by port-dragging, a searchable connector, or one-click batch chaining.

> The interaction model follows Langflow and Dify (both built on the same `@xyflow/react` / React Flow engine) — but the nodes here aren't abstract operators, they're **your real, existing conversations**. 中文说明见 [README.md](./README.md).

## Features

| Module | Description |
|--------|-------------|
| 🗂 Workspace sidebar | Auto-discovers all local WorkBuddy workspaces (`~/.workbuddy/projects`), showing paths and conversation counts |
| 🖥 Embedded in WorkBuddy | The studio is hosted in **WorkBuddy's built-in browser panel** (launched via an MCP tool or a one-line skill), so it lives in the middle of the host UI; **double-click a node** to jump back to the native conversation via a `workbuddy://chat/<uuid>` deep link |
| 🎨 Canvas orchestration | All conversations are laid out automatically on entry; cards come in **S / M / L** tiers by message count, arranged in a snake grid; wheel zoom, drag-to-pan, minimap, fit-view, marquee selection |
| 🏷 Node cards | Title + message count + last-updated + a two-line excerpt of the first user prompt; quick actions for **Preview / Connect / Delete**, plus a one-click "next conversation" row |
| 🔗 Smart connections | ① Port dragging; ② "Connect →" opens a connector with **Search / Timeline tabs** (Enter links the first hit; the canvas flies to the target and highlights it); ③ one-click adjacent connection; ④ **batch auto-chaining** of marquee-selected nodes with your choice of ordering. Cycle detection and de-duplication throughout |
| 🔍 Preview modal | "Preview" opens a read-only reader with the full message stream (role bubbles / model / timestamps); step along connections to the previous/next node; `Esc` to close |
| 🗃 Multiple flows | Named workflows per workspace; edits auto-draft after 0.8 s, "Save" writes a release version; rename / delete / export to JSON |
| ⏪ Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z`, covering move / connect / delete / layout actions |
| 📋 List mode | The classic tabbed conversation browser, one click away |

## Quick Start

### Option 1 — One-click install (Windows, recommended)

Double-click **`scripts/install.cmd`** in the repo — it detects Node, installs dependencies, builds the frontend, merges itself into `~/.workbuddy/mcp.json` (idempotent, never overwrites existing entries), installs the "Conversation Flow Studio" skill, and prints activation instructions. Run `scripts/uninstall.cmd` to remove it (conversation data is never touched).

After installing: in WorkBuddy, go to **Connector Management → Custom Connectors** and **trust** `wb-convo-flow`, then simply ask WorkBuddy to *"open the conversation flow studio"*.

### Option 2 — Run manually

```bash
git clone https://github.com/LinZhaorui/wb-convo-flow.git wb-convo-flow
cd wb-convo-flow
npm install
npm run build
npm start          # open http://127.0.0.1:3457
```

Development mode (hot reload):

```bash
npm run server     # terminal 1: API server (3457)
npm run dev        # terminal 2: Vite dev server (5173, /api proxied)
```

## Three ways to embed in WorkBuddy

| Option | Description |
|--------|-------------|
| **Built-in panel (recommended)** | Call the MCP tool `open_flow_studio` from a WorkBuddy chat (or trigger the skill by name) → the studio renders inside **WorkBuddy's built-in browser panel**, right in the middle of the host UI — no context switch needed |
| Standalone browser | Open `http://127.0.0.1:3457` directly; identical data, useful as a fallback |
| Deep-link round trip | **Double-click any conversation node** → the `workbuddy://chat/<uuid>` deep link brings the WorkBuddy main window to the foreground on that conversation's native full view; a toast appears if WorkBuddy isn't running |

> Manual MCP registration (equivalent to what the installer writes): add to the `mcpServers` section of `~/.workbuddy/mcp.json` (never overwrite existing entries):
>
> ```json
> {
>   "mcpServers": {
>     "wb-convo-flow": {
>       "command": "node",
>       "args": ["<absolute-path-to-this-repo>/server/mcp-server.js"]
>     }
>   }
> }
> ```
>
> Then **trust** the connector in WorkBuddy's Connector Management page. Available tools: `open_flow_studio` (starts the local server and returns the URL) and `list_workspaces` (workspace overview).

## Desktop installers

The project also ships **native installers for Windows / macOS / Linux** (Electron-wrapped, runtime bundled, zero external dependencies).

### Download

Grab the package for your platform from the GitHub **Releases** page:

| Platform | File | Notes |
|----------|------|-------|
| Windows | `WB Convo Flow-0.3.0-setup.exe` | NSIS installer — choose install dir, desktop shortcut |
| macOS | `WB Convo Flow-0.3.0-x64.dmg` / `...-arm64.dmg` (plus `.zip`) | Intel & Apple Silicon; **unsigned** — see note below |
| Linux | `WB Convo Flow-0.3.0-x64.AppImage` / `...-x64.deb` | AppImage runs directly; `.deb` via `dpkg -i` |

> macOS unsigned note: the repo has no Apple Developer certificate, so the macOS build is unsigned. If Gatekeeper blocks the first launch, **right-click → Open** in Finder, or run `xattr -cr /Applications/WB\ Convo\ Flow.app` and try again.

### Build from source

```bash
npm install
npm run build        # build frontend into dist/
npm run dist         # package for the current platform (outputs to release/)
# or target a platform:
npm run dist:win     # Windows: release/*.exe
npm run dist:mac     # macOS:   release/*.dmg + *.zip
npm run dist:linux   # Linux:   release/*.AppImage + *.deb
```

### Automated release

Pushing a version tag triggers GitHub Actions to build on all three platforms and publish to Releases:

```bash
git tag v0.3.0 && git push origin v0.3.0
```

## Interaction cheat sheet

| Action | How |
|--------|-----|
| Lay out all conversations | Automatic on entering canvas mode; use "Re-layout" in the toolbar to add missing ones |
| Select a node | Single click (Shift for multi-select) |
| Open the native conversation in WorkBuddy | **Double-click the node** (`workbuddy://` deep link); the modal also has an "Open in WorkBuddy" button |
| Preview within the canvas | Card "Preview" → modal (step along connections at the bottom) |
| Connect by dragging | Drag from a node's right port to the target's left port |
| Connect via the picker | Click "Connect →" → filter as you type (Enter links the first hit) or switch to the "Timeline" tab → the canvas flies to the target and highlights it |
| Adjacent quick connect | Click the "Next" row on a card to link the temporally adjacent conversation (marked once connected) |
| Batch auto-chain | Select ≥2 nodes (Shift/marquee) → pick an ordering (last-updated / created / message count) → "Auto-chain" |
| Delete node / edge | Card "Delete" button, or select and press `Delete` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Zoom / pan | Mouse wheel / drag the empty canvas; navigate via the minimap |

> Notes: connection direction is unconstrained (only cycles are rejected); "Preview" is read-only — continuing a conversation programmatically requires a session API from WorkBuddy (tracked on the roadmap); deep links require the WorkBuddy desktop app to be running.

## Workflow data

- Storage: `~/.workbuddy/projects/<workspace>/wb-convo-flows/<flowId>.json`
- Shape: `{ name, nodes, edges, viewport, draft, updatedAt, savedAt }`
- `draft: true` marks an auto-saved draft; `savedAt` is the timestamp of the last explicit save
- The legacy single-file `wb-convo-flow.json` migrates automatically into a default flow on first access
- The "Export" button downloads the current flow as JSON for sharing and backup

See [docs/architecture.md](./docs/architecture.md) for the full data contract and API reference, and [docs/interaction.md](./docs/interaction.md) for interaction design rules.

## Architecture

```
┌─ Frontend: React 18 + @xyflow/react v12 + Zustand ─────────┐
│ Toolbar (modes / flows / canvas)      WorkspaceSidebar     │
│ Canvas mode: FlowCanvas + ConversationNode (3 tiers) + Modal │
│ List mode:   ConversationTabs + ConversationViewer          │
│ State: useAppStore (workspace/mode/modal)                   │
│        useFlowStore (canvas/history/flows)                  │
│ Layout: lib/layout.js (tiered snake grid)                   │
└──────────────┬──────────────────────────────────────────────┘
               │ /api JSON
┌──────────────▼─ Backend: Node + Express ────────────────────┐
│ wb-data.js    read-only parser for workspace jsonl          │
│ flow-store.js multi-flow CRUD + auto-draft + legacy migrate │
│ mcp-server.js WorkBuddy plugin entry (stdio)                │
└─────────────────────────────────────────────────────────────┘
```

## Repository layout

```
wb-convo-flow/
├─ README.md / README.en.md / LICENSE / CONTRIBUTING.md / CHANGELOG.md
├─ docs/                    # architecture / interaction / research
├─ .github/                 # Issue & PR templates
├─ scripts/
│  ├─ install.cmd           # one-click installer (double-click)
│  ├─ uninstall.cmd         # one-click uninstaller
│  └─ setup.js              # install core (idempotent mcp.json merge / skill install)
├─ skill/对话工作流编排器/
│  └─ SKILL.md              # WorkBuddy skill: launch the studio by name
├─ server/
│  ├─ server.js             # Express routes + static hosting
│  ├─ wb-data.js            # read-only WorkBuddy data layer
│  ├─ flow-store.js         # multi-flow storage
│  └─ mcp-server.js         # MCP stdio entry
└─ src/
   ├─ App.jsx / api.js / main.jsx / styles.css
   ├─ store/                # useAppStore / useFlowStore
   ├─ lib/                  # layout.js (grid algorithm) / deeplink.js
   └─ components/
      ├─ Toolbar.jsx  WorkspaceSidebar.jsx  Toast.jsx
      ├─ ConversationTabs.jsx  ConversationViewer.jsx
      ├─ canvas/   # FlowCanvas / ConversationNode / ConnectionPicker
      ├─ modal/    # ConversationModal
      └─ workflow/ # FlowMenu
```

## Roadmap

- [ ] **Flow execution**: replay chained conversations in topological order (requires a WorkBuddy session API)
- [ ] More node types: condition branches, sticky notes, external tools (declarative metadata registry)
- [ ] Persisted undo history and flow version snapshots
- [ ] Flow import (the dual of export) and cross-workspace copy
- [ ] Paged loading for very large conversations (>5 MB jsonl)

## License

[MIT](./LICENSE)
