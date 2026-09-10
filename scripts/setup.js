#!/usr/bin/env node
// 一键安装/卸载核心逻辑（跨平台，由 install.cmd / uninstall.cmd 调用）
// install:   校验构建产物 → 幂等合并 ~/.workbuddy/mcp.json → 安装中文命名技能 → 输出启用指引
// uninstall: 从 mcp.json 移除条目 → 移除技能目录（对话与工作流数据全部保留）
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SKILL_NAME = '对话工作流编排器'
const HOME = os.homedir()
const MCP_JSON = path.join(HOME, '.workbuddy', 'mcp.json')
const SKILL_DEST = path.join(HOME, '.workbuddy', 'skills', SKILL_NAME)
const SERVER_ENTRY = path.join(ROOT, 'server', 'mcp-server.js')

const MCP_ENTRY = { command: 'node', args: [SERVER_ENTRY] }

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function install() {
  console.log('[1/4] 检查构建产物...')
  const distIndex = path.join(ROOT, 'dist', 'index.html')
  if (!fs.existsSync(distIndex)) {
    console.error('  ✗ 未找到 dist/index.html。请先在本仓库执行：npm install && npm run build')
    process.exit(1)
  }
  console.log('  ✓ dist 就绪')

  console.log('[2/4] 写入 MCP 连接器（幂等，不影响已有条目）...')
  fs.mkdirSync(path.dirname(MCP_JSON), { recursive: true })
  const cfg = readJson(MCP_JSON) || {}
  cfg.mcpServers = cfg.mcpServers || {}
  const existed = !!cfg.mcpServers['wb-convo-flow']
  cfg.mcpServers['wb-convo-flow'] = MCP_ENTRY
  fs.writeFileSync(MCP_JSON, JSON.stringify(cfg, null, 2), 'utf8')
  console.log(`  ✓ ${existed ? '已更新' : '已写入'}: ${MCP_JSON}`)

  console.log('[3/4] 安装技能（用于在 WorkBuddy 内一句话唤起）...')
  const skillSrc = path.join(ROOT, 'skill', SKILL_NAME)
  if (fs.existsSync(path.join(skillSrc, 'SKILL.md'))) {
    fs.rmSync(SKILL_DEST, { recursive: true, force: true })
    fs.mkdirSync(path.dirname(SKILL_DEST), { recursive: true })
    fs.cpSync(skillSrc, SKILL_DEST, { recursive: true })
    console.log(`  ✓ 技能已安装: ${SKILL_DEST}`)
  } else {
    console.log('  - 未找到技能源文件，跳过')
  }

  console.log('[4/4] 完成。接下来请手动启用：')
  console.log(`
  1. 打开 WorkBuddy → 连接器管理 → 右上角「自定义连接器」→ 找到 wb-convo-flow 点击「信任」
  2. 在 WorkBuddy 对话中说：打开对话工作流编排器
     （WorkBuddy 将在内置浏览器面板中打开编排器，即嵌入主界面中部）
  3. 也可以随时用浏览器访问 http://127.0.0.1:3457
  4. 若服务未运行，MCP 工具 open_flow_studio 会自动拉起它
`)
}

function uninstall() {
  const cfg = readJson(MCP_JSON)
  if (cfg && cfg.mcpServers && cfg.mcpServers['wb-convo-flow']) {
    delete cfg.mcpServers['wb-convo-flow']
    fs.writeFileSync(MCP_JSON, JSON.stringify(cfg, null, 2), 'utf8')
    console.log('[1/2] 已从 mcp.json 移除 wb-convo-flow 条目')
  } else {
    console.log('[1/2] mcp.json 中未发现 wb-convo-flow 条目（无需处理）')
  }
  if (fs.existsSync(SKILL_DEST)) {
    fs.rmSync(SKILL_DEST, { recursive: true, force: true })
    console.log('[2/2] 已移除技能目录')
  } else {
    console.log('[2/2] 未发现已安装的技能（无需处理）')
  }
  console.log('✅ 卸载完成。所有对话与工作流数据保留在工作空间目录中，未做任何改动。')
}

const cmd = process.argv[2]
if (cmd === 'install') install()
else if (cmd === 'uninstall') uninstall()
else {
  console.log('用法: node scripts/setup.js install|uninstall')
  process.exit(1)
}
