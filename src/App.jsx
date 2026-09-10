import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Toolbar from './components/Toolbar.jsx'
import WorkspaceSidebar from './components/WorkspaceSidebar.jsx'
import ConversationTabs from './components/ConversationTabs.jsx'
import ConversationViewer from './components/ConversationViewer.jsx'
import FlowCanvas from './components/canvas/FlowCanvas.jsx'
import ConversationModal from './components/modal/ConversationModal.jsx'
import Toast from './components/Toast.jsx'
import { useAppStore, MODE_CANVAS, MODE_LIST } from './store/useAppStore.js'
import { useFlowStore } from './store/useFlowStore.js'

export default function App() {
  const loadWorkspaces = useAppStore(s => s.loadWorkspaces)
  const mode = useAppStore(s => s.mode)
  const currentWorkspaceId = useAppStore(s => s.currentWorkspaceId)
  const conversations = useAppStore(s => s.conversations)
  const conversationsLoading = useAppStore(s => s.conversationsLoading)
  const openConversation = useAppStore(s => s.openConversation)
  const activeTabUuid = useAppStore(s => s.activeTabUuid)
  const ensureWorkspace = useFlowStore(s => s.ensureWorkspace)

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  // 工作空间 / 模式变化后的联动：
  // 画布模式 → 确保工作流就绪（首次自动铺开全部对话）
  // 列表模式 → 自动打开第一个对话 Tab
  useEffect(() => {
    if (!currentWorkspaceId) return
    if (mode === MODE_CANVAS) {
      if (!conversationsLoading) ensureWorkspace(currentWorkspaceId, conversations)
    } else if (mode === MODE_LIST && !activeTabUuid && conversations.length > 0) {
      openConversation(conversations[0].uuid)
    }
  }, [currentWorkspaceId, mode, conversations, conversationsLoading, activeTabUuid, ensureWorkspace, openConversation])

  // 全局快捷键：撤销 / 重做
  useEffect(() => {
    const onKey = (e) => {
      if (mode !== MODE_CANVAS) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useFlowStore.getState().redo()
        else useFlowStore.getState().undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  return (
    <ReactFlowProvider>
      <div className="app">
        <Toolbar />
        <div className="body">
          <WorkspaceSidebar />
          <main className="main">
            {mode === MODE_LIST ? (
              <>
                <ConversationTabs />
                <ConversationViewer />
              </>
            ) : (
              <FlowCanvas />
            )}
          </main>
        </div>
        <ConversationModal />
        <Toast />
      </div>
    </ReactFlowProvider>
  )
}
