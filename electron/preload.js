// 预加载脚本：在隔离上下文中向渲染进程暴露最小安全接口。
// 仅提供「用系统默认方式打开外部链接」能力，用于 workbuddy:// 深链唤起 WorkBuddy 桌面端。
import { contextBridge, shell } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => {
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('workbuddy://'))) {
      shell.openExternal(url)
    }
  },
  isElectron: true
})
