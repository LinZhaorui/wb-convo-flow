// Electron 主进程（ESM）。内嵌 Express 后端，打开一个加载本地服务的窗口。
// 双击对话节点产生的 workbuddy:// 深链会被拦截并转交系统打开 WorkBuddy 桌面端。
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApp } from '../server/app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3457

// 单实例：避免重复打开多个窗口
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

let mainWindow = null
let server = null

function startServer() {
  const expressApp = buildApp()
  return new Promise((resolve, reject) => {
    server = expressApp.listen(PORT, '127.0.0.1', () => resolve())
    server.on('error', reject)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'WorkBuddy 对话工作流编排器',
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  })

  // 开发态可指向 Vite dev server；生产态加载内嵌后端
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) mainWindow.loadURL(devUrl)
  else mainWindow.loadURL(`http://127.0.0.1:${PORT}`)

  // 拦截 workbuddy:// 深链，交给系统唤起 WorkBuddy 桌面端（已在 WorkBuddy 中打开原生对话）
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('workbuddy://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('workbuddy://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  try {
    await startServer()
  } catch (e) {
    console.error('后端启动失败：', e)
  }
  createWindow()

  app.on('second-instance', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus() }
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (server) server.close()
  if (process.platform !== 'darwin') app.quit()
})
