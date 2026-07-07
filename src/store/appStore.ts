import { create } from 'zustand';
import { convertText, getQuota } from '@/api/convert';
import { getStoredUsername } from '@/api/auth';
import { getVisitorId } from '@/utils/visitorId';

interface UserState {
  username: string;
  isLoggedIn: boolean;
  isVip?: boolean;
}

interface AppState {
  inputText: string;
  outputText: string;
  selectedStyle: string;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number;
  user: UserState;
  showLoginModal: boolean;
  showRegisterModal: boolean;
  showQuotaAlert: boolean;
  
  setInput: (text: string) => void;
  setOutput: (text: string) => void;
  setStyle: (style: string) => void;
  setError: (error: string | null) => void;
  setUser: (user: UserState) => void;
  setShowLoginModal: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
  setShowQuotaAlert: (show: boolean) => void;
  logout: () => void;
  convert: () => Promise<void>;
  fetchQuota: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  inputText: '',
  outputText: '',
  selectedStyle: 'formal',
  isLoading: false,
  error: null,
  remainingQuota: 10,
  user: {
    username: getStoredUsername() || '',
    isLoggedIn: !!getStoredUsername(),
  },
  showLoginModal: false,
  showRegisterModal: false,
  showQuotaAlert: false,

  setInput: (text) => set({ inputText: text }),
  setOutput: (text) => set({ outputText: text }),
  setStyle: (style) => set({ selectedStyle: style }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user }),
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setShowRegisterModal: (show) => set({ showRegisterModal: show }),
  setShowQuotaAlert: (show) => set({ showQuotaAlert: show }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    set({ 
      user: { username: '', isLoggedIn: false, isVip: false },
      remainingQuota: 0 // 可选重置，但 fetchQuota 会刷新
    });
  },

  convert: async () => {
    const { inputText, selectedStyle } = get();
    if (!inputText.trim()) {
      set({ error: '请输入要转换的文本' });
      return;
    }
    if (inputText.length > 2000) {
      set({ error: '文本长度不能超过 2000 字' });
      return;
    }

    set({ isLoading: true, error: null, outputText: '' });

    try {
      const result = await convertText({ text: inputText, style: selectedStyle });
      set({ outputText: result, isLoading: false });
      await get().fetchQuota();
    } catch (err: any) {
      const errorMsg = err.message || '转换失败，请稍后重试';
      // 检查是否是次数用尽的错误
      if (errorMsg.includes('次数已用完') || errorMsg.includes('免费次数')) {
        set({ error: errorMsg, isLoading: false });
        set({ showQuotaAlert: true });
      } else {
        set({ error: errorMsg, isLoading: false });
      }
    }
  },

  fetchQuota: async () => {
    try {
      const quota = await getQuota();
      set({ remainingQuota: quota });
    } catch {
      // 如果获取失败，保持当前值
    }
  },

  reset: () => {
    set({
      inputText: '',
      outputText: '',
      error: null,
      isLoading: false,
    });
  },
}));