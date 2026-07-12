import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiShare2, FiX } from 'react-icons/fi';
import './SharePoster.less';

interface SharePosterProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  convertedText: string;
  styleName: string;
}

const STYLE_MAP: Record<string, string> = {
  formal: '职场汇报',
  xiaohongshu: '小红书种草',
  wechat: '微信私聊',
  email: '邮件沟通',
  academic: '专业严谨',
  marketing: '营销文案',
  customer_service: '客户沟通',
  concise: '简洁直接',
  polite: '温和礼貌',
  moments: '朋友圈分享',
  short_video: '短视频口播',
};

export const SharePoster: React.FC<SharePosterProps> = ({
  isOpen,
  onClose,
  originalText,
  convertedText,
  styleName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string>('');

  const displayStyle = STYLE_MAP[styleName] || styleName || '职场汇报';

  // 绘制海报
  const drawPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const width = 400;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f5f3ff');
    gradient.addColorStop(1, '#ede9fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    let y = 30;

    // ===== Logo =====
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(16, y - 10, 32, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('🎲', 24, y + 14);

    // 品牌名
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('语气魔方', 58, y + 8);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.fillText('✨ AI 驱动', 340, y + 8);

    y += 44;

    // ===== 分隔线 =====
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(width - 16, y);
    ctx.stroke();

    y += 20;

    // ===== 原文 =====
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.fillText('📝 原文', 16, y);

    y += 18;
    const originalLines = wrapText(ctx, originalText || '（未提供原文）', width - 32);
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px sans-serif';
    originalLines.forEach((line, i) => {
      ctx.fillText(line, 16, y + i * 22);
    });
    y += originalLines.length * 22 + 16;

    // ===== 风格标签 =====
    const labelText = `✨ 转换结果  ·  ${displayStyle}`;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.fillText(labelText, 16, y);

    y += 18;
    const convertedLines = wrapText(ctx, convertedText || '（等待转换）', width - 32);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px sans-serif';
    convertedLines.forEach((line, i) => {
      ctx.fillText(line, 16, y + i * 22);
    });
    y += convertedLines.length * 22 + 16;

    // ===== 底部 =====
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(width - 16, y);
    ctx.stroke();

    y += 16;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.fillText('✨ 语气魔方 · 一键切换文本语气', 16, y + 10);

    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, width - 16, y + 10);
    ctx.textAlign = 'left';

    // 生成图片数据
    setPosterDataUrl(canvas.toDataURL('image/png'));
  };

  // 文字换行辅助函数
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // 初始化绘制
  useEffect(() => {
    if (isOpen) {
      // 延迟一帧确保 canvas 已渲染
      setTimeout(drawPoster, 50);
    }
  }, [isOpen, originalText, convertedText, styleName]);

  // 下载
  const handleDownload = () => {
    if (!posterDataUrl) return;
    const link = document.createElement('a');
    link.download = `语气魔方-${Date.now()}.png`;
    link.href = posterDataUrl;
    link.click();
  };

  // 分享
  const handleShare = async () => {
    if (!posterDataUrl) return;
    setIsGenerating(true);
    try {
      const blob = await fetch(posterDataUrl).then(res => res.blob());
      if (navigator.share) {
        await navigator.share({
          title: '语气魔方 - AI语气转换',
          text: `我用语气魔方把「${originalText.slice(0, 20)}...」转换成了「${convertedText.slice(0, 20)}...」`,
          files: [new File([blob], '语气魔方.png', { type: 'image/png' })],
        });
      } else {
        const link = document.createElement('a');
        link.download = `语气魔方-${Date.now()}.png`;
        link.href = posterDataUrl;
        link.click();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        alert('分享失败，请重试');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-mask modal-mask--strong"
      onClick={onClose}
    >
      <div
        className="share-poster"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="share-poster-close"
        >
          <FiX size={24} />
        </button>

        <h3 className="share-poster-title">
          📸 分享你的转换成果
        </h3>

        {/* 海报预览（Canvas） */}
        <div className="poster-preview">
          <canvas
            ref={canvasRef}
            className="poster-canvas"
          />
        </div>

        {/* 操作按钮 */}
        <div className="share-actions">
          <button
            onClick={handleDownload}
            disabled={!posterDataUrl}
            className="share-action-btn share-action-btn--plain"
          >
            <FiDownload />
            保存图片
          </button>
          <button
            onClick={handleShare}
            disabled={isGenerating || !posterDataUrl}
            className="share-action-btn share-action-btn--primary"
          >
            <FiShare2 />
            {isGenerating ? '处理中...' : '分享'}
          </button>
        </div>
      </div>
    </div>
  );
};
