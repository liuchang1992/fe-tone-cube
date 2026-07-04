import { create } from 'zustand';
import { convertText } from '@/api/convert';

interface AppState {
  inputText: string;
  outputText: string;
  selectedStyle: string;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number;         // 今日剩余免费次数
  setInput: (text: string) => void;
  setOutput: (text: string) => void;
  setStyle: (style: string) => void;
  setError: (error: string | null) => void;
  convert: () => Promise<void>;
  fetchQuota: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  inputText: '',
  outputText: '',
  selectedStyle: 'formal',
  isLoading: false,
  error: null,
  remainingQuota: 5,

  setInput: (text) => set({ inputText: text }),
  setOutput: (text) => set({ outputText: text }),
  setStyle: (style) => set({ selectedStyle: style }),
  setError: (error) => set({ error }),

  convert: async () => {
    const { inputText, selectedStyle } = get();
    if (!inputText.trim()) {
      set({ error: '请输入要转换的文本' });
      return;
    }
    if (inputText.length > 2000) {
      set({ error: '文本长度不能超过2000字' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await convertText({ text: inputText, style: selectedStyle });
      set({ outputText: result, isLoading: false });
      // 转换成功后重新获取剩余配额（因为后端扣除了次数）
      await get().fetchQuota();
    } catch (err: any) {
      set({ error: err.message || '转换失败，请稍后重试', isLoading: false });
    }
  },

  fetchQuota: async () => {
    try {
      // 从后端获取今日剩余次数
      // const quota = await getQuotaFromAPI();
      // set({ remainingQuota: quota });
    } catch {
      // 默认显示5次，但提示可能不准
      set({ remainingQuota: 5 });
    }
  },
}));