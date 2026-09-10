// WorkBuddy 深度链接
// 应用安装时已注册 workbuddy:// 协议（app.asar 中含 workbuddy://chat/<uuid> 等路由），
// 触发后由操作系统唤起 WorkBuddy 主窗口并定位到对应对话。
export function openInWorkbuddy(conversationUuid) {
  if (!conversationUuid) return false
  const url = `workbuddy://chat/${conversationUuid}`
  try {
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
