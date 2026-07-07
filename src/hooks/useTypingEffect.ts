import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  /** 打字速度（毫秒/字），默认 30ms */
  speed?: number;
  /** 是否自动开始，默认 true */
  autoStart?: boolean;
}

export function useTypingEffect(
  fullText: string,
  options: UseTypingEffectOptions = {}
) {
  const { speed = 30, autoStart = true } = options;
  
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 当 fullText 变化时重置并开始打字
  useEffect(() => {
    // 清空之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // 重置状态
    setDisplayText('');
    indexRef.current = 0;
    setIsComplete(false);
    setIsTyping(false);

    // 如果文本为空，直接完成
    if (!fullText) {
      setIsComplete(true);
      return;
    }

    // 如果不需要自动开始，只显示完整文本
    if (!autoStart) {
      setDisplayText(fullText);
      setIsComplete(true);
      return;
    }

    // 开始打字
    setIsTyping(true);
    const totalLength = fullText.length;

    const typeNext = () => {
      if (indexRef.current < totalLength) {
        // 每次增加 1-3 个字符，模拟更自然的打字节奏
        const step = Math.random() > 0.7 ? 2 : 1;
        const nextIndex = Math.min(indexRef.current + step, totalLength);
        setDisplayText(fullText.substring(0, nextIndex));
        indexRef.current = nextIndex;
        
        // 随机延迟 20-50ms，模拟人类打字的不均匀节奏
        const delay = speed + (Math.random() * 20 - 10);
        timerRef.current = setTimeout(typeNext, delay);
      } else {
        setIsComplete(true);
        setIsTyping(false);
        timerRef.current = null;
      }
    };

    // 延迟 100ms 开始，让用户看到“正在输入”的过渡
    timerRef.current = setTimeout(typeNext, 100);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, speed, autoStart]);

  // 手动控制：立即完成打字
  const skip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDisplayText(fullText);
    indexRef.current = fullText.length;
    setIsComplete(true);
    setIsTyping(false);
  };

  // 重置
  const reset = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDisplayText('');
    indexRef.current = 0;
    setIsComplete(false);
    setIsTyping(false);
  };

  return {
    displayText,
    isComplete,
    isTyping,
    skip,
    reset,
  };
}