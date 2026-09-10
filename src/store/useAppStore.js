// 应用级状态：工作空间、模式（画布/列表）、对话列表、模态窗
import { create } from 'zustand'
import * as api from '../api'

export const MODE_CANVAS = 'canvas'
export const MODE_LIST = 'list'

let toastTimer = null

export const useAppStore = create((set, get) => ({
  workspaces: [],
  workspacesLoading: false,

  // 轻量提示（深链唤起、连线结果等）
  toast: null,

  currentWorkspaceId: null,
  conversations: [],
  conversationsLoading: false,

  mode: MODE_CANVAS,

  // 列表模式（Tab 浏览）
  activeTabUuid: null,
  currentConversation: null,
  currentConversationLoading: false,

  // 模态对话窗（画布模式双击节点打开）
  modalUuid: null,
  modalConversation: null,
  modalLoading: false,

  setMode(mode) { set({ mode }) },

  showToast(text, kind = 'info', duration = 2800) {
    set({ toast: { text, kind, id: Date.now() } })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), duration)
  },

  async loadWorkspaces() {
    set({ workspacesLoading: true })
    try {
      const list = await api.getWorkspaces()
      set({ workspaces: list, workspacesLoading: false })
      return list
    } catch {
      set({ workspacesLoading: false })
      return []
    }
  },

  async selectWorkspace(wsId) {
    set({
      currentWorkspaceId: wsId,
      conversations: [],
      activeTabUuid: null,
      currentConversation: null,
      modalUuid: null,
      modalConversation: null
    })
    if (!wsId) return
    set({ conversationsLoading: true })
    try {
      const list = await api.getConversations(wsId)
      set({ conversations: list, conversationsLoading: false })
      return list
    } catch {
      set({ conversationsLoading: false })
      return []
    }
  },

  // 列表模式：打开某个对话 Tab
  async openConversation(uuid) {
    const wsId = get().currentWorkspaceId
    if (!wsId) return
    set({ activeTabUuid: uuid, currentConversationLoading: true })
    try {
      const c = await api.getConversation(wsId, uuid)
      set({ currentConversation: c, currentConversationLoading: false })
    } catch {
      set({ currentConversationLoading: false })
    }
  },

  // 模态对话窗
  async openModal(uuid) {
    const wsId = get().currentWorkspaceId
    if (!wsId || !uuid) return
    set({ modalUuid: uuid, modalConversation: null, modalLoading: true })
    try {
      const c = await api.getConversation(wsId, uuid)
      // 用户可能已快速切换到其他模态
      if (get().modalUuid !== uuid) return
      set({ modalConversation: c, modalLoading: false })
    } catch {
      set({ modalLoading: false })
    }
  },

  closeModal() {
    set({ modalUuid: null, modalConversation: null, modalLoading: false })
  }
}))
