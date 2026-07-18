import { create } from 'zustand';
import { message } from 'antd';
import {
  convertTextDetailed,
  getQuota,
  type RewriteStrength,
} from '@/api/convert';
import {
  createDocumentConvertTask,
  getDocumentConvertTask,
  type DocumentConvertResponse,
} from '@/api/documentConvert';
import { getStoredToken, getStoredUsername } from '@/api/auth';
import { restoreSensitiveText, type PrivacyMapping } from '@/utils/privacyMasking';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const ACTIVE_DOCUMENT_TASK_KEY = 'activeDocumentTaskId';
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const storedUsername = getStoredUsername();
const hasStoredSession = Boolean(storedUsername && getStoredToken());

const waitForDocumentTask = async (
  taskId: string,
  onProgress: (progress: number, taskMessage: string) => void,
): Promise<DocumentConvertResponse> => {
  for (let attempt = 0; attempt < 900; attempt += 1) {
    const task = await getDocumentConvertTask(taskId);
    onProgress(task.progress, task.message);
    if (task.status === 'completed' && task.result) return task.result;
    if (task.status === 'failed') throw new Error(task.error || '文档转换失败，本次次数已返还');
    await wait(1000);
  }
  throw new Error('文档转换等待超时，请稍后刷新页面查看');
};

interface UserState {
  username: string;
  isLoggedIn: boolean;
  isVip?: boolean;
}

interface ConversionContext {
  inputText: string;
  style: string;
  personalStyleId: number;
  personalStyleName: string;
  personalStyleVersion: number | null;
  comparisonGroupId: string;
  rewriteStrength: RewriteStrength;
}

interface PrivacyConversionOptions {
  requestText: string;
  mappings: PrivacyMapping[];
}

interface AppState {
  inputText: string;
  outputText: string;
  selectedStyle: string;
  selectedPersonalStyleId: number | null;
  selectedPersonalStyleName: string;
  selectedPersonalStyleVersion: number | null;
  selectedRewriteStrength: RewriteStrength;
  lastPersonalConversion: ConversionContext | null;
  lastConversionPrivacyCount: number;
  lastConversionPrivacyMode: boolean;
  isLoading: boolean;
  isDocumentLoading: boolean;
  documentTaskProgress: number;
  documentTaskMessage: string;
  documentTaskResult: DocumentConvertResponse | null;
  isDocumentPreviewOpen: boolean;
  error: string | null;
  remainingQuota: number;
  documentRemainingQuota: number | null;
  user: UserState;
  showLoginModal: boolean;
  showRegisterModal: boolean;
  showPersonalStyleOnboarding: boolean;
  preserveConversionDraft: boolean;
  showQuotaAlert: boolean;
  
  setInput: (text: string) => void;
  setOutput: (text: string) => void;
  setStyle: (style: string) => void;
  setPersonalStyle: (styleId: number | null, name?: string, version?: number | null) => void;
  setRewriteStrength: (strength: RewriteStrength) => void;
  setError: (error: string | null) => void;
  setUser: (user: UserState) => void;
  setShowLoginModal: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
  setShowPersonalStyleOnboarding: (show: boolean) => void;
  setPreserveConversionDraft: (preserve: boolean) => void;
  setShowQuotaAlert: (show: boolean) => void;
  logout: () => void;
  convert: (privacy?: PrivacyConversionOptions) => Promise<void>;
  convertDocument: (file: File) => Promise<DocumentConvertResponse | null>;
  resumeDocumentConversion: () => Promise<void>;
  setDocumentPreviewOpen: (open: boolean) => void;
  fetchQuota: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  inputText: '',
  outputText: '',
  selectedStyle: 'formal',
  selectedPersonalStyleId: null,
  selectedPersonalStyleName: '',
  selectedPersonalStyleVersion: null,
  selectedRewriteStrength: 'standard',
  lastPersonalConversion: null,
  lastConversionPrivacyCount: 0,
  lastConversionPrivacyMode: false,
  isLoading: false,
  isDocumentLoading: false,
  documentTaskProgress: 0,
  documentTaskMessage: '',
  documentTaskResult: null,
  isDocumentPreviewOpen: false,
  error: null,
  remainingQuota: 2,
  documentRemainingQuota: null,
  user: {
    username: hasStoredSession ? storedUsername || '' : '',
    isLoggedIn: hasStoredSession,
  },
  showLoginModal: false,
  showRegisterModal: false,
  showPersonalStyleOnboarding: false,
  preserveConversionDraft: false,
  showQuotaAlert: false,

  setInput: (text) => set({ inputText: text }),
  setOutput: (text) => set({
    outputText: text,
    lastPersonalConversion: null,
    lastConversionPrivacyCount: 0,
    lastConversionPrivacyMode: false,
  }),
  setStyle: (style) => set({ selectedStyle: style }),
  setPersonalStyle: (styleId, name = '', version = null) => set({
    selectedPersonalStyleId: styleId,
    selectedPersonalStyleName: styleId ? name : '',
    selectedPersonalStyleVersion: styleId ? version : null,
  }),
  setRewriteStrength: (strength) => set({ selectedRewriteStrength: strength }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setShowRegisterModal: (show) => set({ showRegisterModal: show }),
  setShowPersonalStyleOnboarding: (show) => set({ showPersonalStyleOnboarding: show }),
  setPreserveConversionDraft: (preserve) => set({ preserveConversionDraft: preserve }),
  setShowQuotaAlert: (show) => set({ showQuotaAlert: show }),
  setDocumentPreviewOpen: (open) => set({ isDocumentPreviewOpen: open }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem(ACTIVE_DOCUMENT_TASK_KEY);
    set({
      user: { username: '', isLoggedIn: false, isVip: false },
      remainingQuota: 0,
      documentRemainingQuota: null,
      // ===== 新增：清空输入和输出 =====
      inputText: '',
      outputText: '',
      error: null,
      isLoading: false,
      isDocumentLoading: false,
      documentTaskProgress: 0,
      documentTaskMessage: '',
      documentTaskResult: null,
      isDocumentPreviewOpen: false,
      selectedPersonalStyleId: null,
      selectedPersonalStyleName: '',
      selectedPersonalStyleVersion: null,
      lastPersonalConversion: null,
      lastConversionPrivacyCount: 0,
      lastConversionPrivacyMode: false,
    });
    // 可选：清空后重新获取访客配额
    setTimeout(() => get().fetchQuota(), 100);
  },

  convert: async (privacy) => {
    const {
      inputText,
      selectedStyle,
      selectedPersonalStyleId,
      selectedPersonalStyleName,
      selectedPersonalStyleVersion,
      selectedRewriteStrength,
    } = get();
    if (!inputText.trim()) {
      set({ error: '请输入要转换的文本' });
      message.warning('请输入要转换的文本');
      return;
    }
    if (inputText.length > 2000) {
      set({ error: '文本长度不能超过 2000 字' });
      message.warning('文本长度不能超过 2000 字');
      return;
    }
    if (privacy && privacy.requestText.length > 2000) {
      set({ error: '脱敏后的文本超过 2000 字，请适当缩短后重试' });
      message.warning('脱敏后的文本超过 2000 字，请适当缩短后重试');
      return;
    }

    set({
      isLoading: true,
      error: null,
      outputText: '',
      lastPersonalConversion: null,
      lastConversionPrivacyCount: 0,
      lastConversionPrivacyMode: false,
    });

    try {
      const conversion = await convertTextDetailed({
        text: privacy?.requestText || inputText,
        style: selectedStyle,
        ...(selectedPersonalStyleId ? { personal_style_id: selectedPersonalStyleId } : {}),
        rewrite_strength: selectedRewriteStrength,
        ...(privacy ? { privacy_mode: true } : {}),
      });
      const restoredResult = privacy
        ? restoreSensitiveText(conversion.result, privacy.mappings)
        : conversion.result;
      set({
        outputText: restoredResult,
        isLoading: false,
        lastConversionPrivacyCount: privacy
          ? privacy.mappings.reduce((total, mapping) => total + mapping.occurrences, 0)
          : 0,
        lastConversionPrivacyMode: Boolean(privacy),
        lastPersonalConversion: selectedPersonalStyleId && !privacy ? {
          inputText,
          style: selectedStyle,
          personalStyleId: selectedPersonalStyleId,
          personalStyleName: selectedPersonalStyleName || '个人风格',
          personalStyleVersion: selectedPersonalStyleVersion,
          comparisonGroupId: conversion.comparisonGroupId || '',
          rewriteStrength: selectedRewriteStrength,
        } : null,
      });
      await get().fetchQuota();
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, '转换失败，请稍后重试');
      if (errorMsg.includes('内容安全检测')) {
        set({ error: errorMsg, isLoading: false });
        message.warning(errorMsg);
        return;
      }
      // 检查是否是次数用尽的错误
      if (errorMsg.includes('次数已用完') || errorMsg.includes('免费次数')) {
        set({ error: errorMsg, isLoading: false });
        const user = get().user;
        if (user.isLoggedIn) {
          message.warning('您的转换次数已用完');
        } else {
          set({ showQuotaAlert: true });
        }
      } else {
        set({ error: errorMsg, isLoading: false });
        message.error(errorMsg);
      }
    }
  },

  convertDocument: async (file) => {
    const { selectedStyle, selectedPersonalStyleId, selectedRewriteStrength } = get();
    set({
      isDocumentLoading: true,
      documentTaskProgress: 0,
      documentTaskMessage: '正在上传文档',
      documentTaskResult: null,
      isDocumentPreviewOpen: false,
      error: null,
    });

    try {
      const created = await createDocumentConvertTask(
        file,
        selectedStyle,
        selectedPersonalStyleId,
        selectedRewriteStrength,
      );
      localStorage.setItem(ACTIVE_DOCUMENT_TASK_KEY, created.task_id);
      const result = await waitForDocumentTask(created.task_id, (progress, taskMessage) => {
        set({ documentTaskProgress: progress, documentTaskMessage: taskMessage });
      });
      localStorage.removeItem(ACTIVE_DOCUMENT_TASK_KEY);
      set({
        isDocumentLoading: false,
        documentTaskProgress: 100,
        documentTaskMessage: '文档转换完成',
        documentTaskResult: result,
        isDocumentPreviewOpen: true,
      });
      await get().fetchQuota();
      return result;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, '文档转换失败，请稍后重试');
      localStorage.removeItem(ACTIVE_DOCUMENT_TASK_KEY);
      if (errorMsg.includes('内容安全检测')) {
        set({ error: errorMsg, isDocumentLoading: false, documentTaskMessage: errorMsg });
        message.warning(errorMsg);
        await get().fetchQuota();
        return null;
      }
      if (errorMsg.includes('次数已用完') || errorMsg.includes('免费次数')) {
        set({ error: errorMsg, isDocumentLoading: false, documentTaskMessage: errorMsg });
        const user = get().user;
        if (user.isLoggedIn) {
          message.warning('您的转换次数已用完');
        } else {
          set({ showQuotaAlert: true });
        }
      } else {
        set({ error: errorMsg, isDocumentLoading: false, documentTaskMessage: errorMsg });
        message.error(errorMsg);
      }
      await get().fetchQuota();
      return null;
    }
  },

  resumeDocumentConversion: async () => {
    const taskId = localStorage.getItem(ACTIVE_DOCUMENT_TASK_KEY);
    if (!taskId || get().isDocumentLoading) return;

    set({
      isDocumentLoading: true,
      documentTaskProgress: 0,
      documentTaskMessage: '正在恢复文档任务',
    });
    try {
      const result = await waitForDocumentTask(taskId, (progress, taskMessage) => {
        set({ documentTaskProgress: progress, documentTaskMessage: taskMessage });
      });
      localStorage.removeItem(ACTIVE_DOCUMENT_TASK_KEY);
      set({
        isDocumentLoading: false,
        documentTaskProgress: 100,
        documentTaskMessage: '文档转换完成',
        documentTaskResult: result,
        isDocumentPreviewOpen: true,
      });
      await get().fetchQuota();
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, '文档任务恢复失败');
      localStorage.removeItem(ACTIVE_DOCUMENT_TASK_KEY);
      set({ isDocumentLoading: false, documentTaskMessage: errorMsg });
      message.error(errorMsg);
      await get().fetchQuota();
    }
  },

  fetchQuota: async () => {
    try {
      const quota = await getQuota();
      set({
        remainingQuota: quota.remaining,
        documentRemainingQuota: quota.document_remaining,
      });
    } catch {
      // 无效 token 会由响应拦截器清除。同步清理内存状态，避免页面仍显示已登录，
      // 却使用游客的文档额度并把上传按钮永久置灰。
      if (!getStoredToken() && get().user.isLoggedIn) {
        set({
          user: { username: '', isLoggedIn: false, isVip: false },
          documentRemainingQuota: null,
          selectedPersonalStyleId: null,
          selectedPersonalStyleName: '',
          selectedPersonalStyleVersion: null,
          lastPersonalConversion: null,
          lastConversionPrivacyCount: 0,
          lastConversionPrivacyMode: false,
        });
      }
    }
  },

  reset: () => {
    set({
      inputText: '',
      outputText: '',
      error: null,
      isLoading: false,
      lastPersonalConversion: null,
      lastConversionPrivacyCount: 0,
      lastConversionPrivacyMode: false,
    });
  },
}));
