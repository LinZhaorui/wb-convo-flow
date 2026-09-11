// WorkBuddy 深度链接
// 应用安装时已注册 workbuddy:// 协议（app.asar 中含 workbuddy://chat/<uuid> 等路由），
// 触发后由操作系统唤起 WorkBuddy 主窗口并定位到对应对话。
//
// 在 Electron 桌面端中，页面内直接跳转 workbuddy:// 会被主进程拦截并通过
// shell.openExternal 交给系统处理；这里优先走 preload 暴露的 electronAPI.openExternal，
// 以保证桌面端也能正确唤起 WorkBuddy 原生窗口。
export function openInWorkbuddy(conversationUuid) {
  if (!conversationUuid) return false
  const url = `workbuddy://chat/${conversationUuid}`
  try {
    if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
      window.electronAPI.openExternal(url)
      return true
    }
    window.location.href = url
    return true
  } catch {
    try {
      window.open(url, '_blank')
      return true
    } catch {
      return false
    }
  }
}
