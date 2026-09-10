import { useAppStore } from '../store/useAppStore.js'

// 全局轻量提示条
export default function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null
  return (
    <div className={`toast ${toast.kind}`}>{toast.text}</div>
  )
}
