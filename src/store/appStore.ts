import { create } from 'zustand';
import { convertText, getQuota } from '@/api/convert';

interface AppState {
  inputText: string;
  outputText: string;
  selectedStyle: string;
  isLoading: boolean;
  error: string | null;
  remainingQuota: number;

  setInput: (text: string) => void;
  setOutput: (text: string) => void;
  setStyle: (style: string) => void;
  setError: (error: string | null) => void;
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
  remainingQuota: 10, // 默认值，会从后端获取

  setInput: (text) => set({ inputText: text }),
  setOutput: (text) => set({ outputText: text }),
  setStyle: (style) => set({ selectedStyle: style }),
  setError: (error) => set({ error }),

  convert: async () => {
    const { inputText, selectedStyle } = get();
    // 校验
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
      // 刷新剩余次数
      await get().fetchQuota();
    } catch (err: any) {
      set({
        error: err.message || '转换失败，请稍后重试',
        isLoading: false,
      });
    }
  },

  fetchQuota: async () => {
    try {
      const quota = await getQuota();
      set({ remainingQuota: quota });
    } catch {
      // 若获取失败，保持当前值，不阻断流程
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