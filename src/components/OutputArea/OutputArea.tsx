import React, { useEffect, useRef, useState } from 'react';
import { message, Modal, Spin } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';

import { convertText } from '@/api/convert';
import { saveComparisonPreference } from '@/api/history';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { useAppStore } from '@/store/appStore';
import './index.less';

export const OutputArea: React.FC = () => {
  const { fetchQuota, isLoading, lastPersonalConversion, outputText, setOutput } = useAppStore();
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [baselineResult, setBaselineResult] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const [comparisonPreference, setComparisonPreference] = useState<'personal' | 'baseline' | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const shouldType = Boolean(outputText && !isLoading);

  const { displayText, isComplete, isTyping, skip } = useTypingEffect(
    shouldType ? outputText : '',
    { speed: 25, autoStart: shouldType }
  );

  useEffect(() => {
    if (outputRef.current && (displayText || isTyping)) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [displayText, isTyping]);

  const handleCopy = async () => {
    const textToCopy = isComplete ? outputText : displayText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      message.success('复制成功');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const outputLength = (isComplete ? outputText : displayText)?.length || 0;

  const openComparison = () => {
    setBaselineResult('');
    setComparisonError('');
    setComparisonPreference(null);
    setComparisonOpen(true);
  };

  const copyComparisonResult = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const chooseComparisonPreference = async (preference: 'personal' | 'baseline') => {
    if (!lastPersonalConversion?.comparisonGroupId || comparisonPreference) return;
    try {
      await saveComparisonPreference(lastPersonalConversion.comparisonGroupId, preference);
      setComparisonPreference(preference);
      message.success('已记录你的选择，提交后不可修改');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '反馈保存失败');
    }
  };

  const adoptBaselineResult = () => {
    if (!baselineResult) return;
    setOutput(baselineResult);
    setComparisonOpen(false);
    message.success('已采用默认效果');
  };

  const adoptPersonalResult = () => {
    setComparisonOpen(false);
    message.success('已保留个人风格结果');
  };

  const generateBaseline = async () => {
    if (!lastPersonalConversion || comparisonLoading) return;
    setComparisonLoading(true);
    setComparisonError('');
    try {
      const result = await convertText({
        text: lastPersonalConversion.inputText,
        style: lastPersonalConversion.style,
        use_personal_style: false,
        comparison_group_id: lastPersonalConversion.comparisonGroupId,
        rewrite_strength: lastPersonalConversion.rewriteStrength,
      });
      setBaselineResult(result);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : '默认效果生成失败';
      setComparisonError(errorText);
      message.error(errorText);
    } finally {
      setComparisonLoading(false);
      await fetchQuota();
    }
  };

  return (
    <div className="output-container">
      <div
        ref={outputRef}
        className={`output-area ${isLoading ? 'output-area--loading' : ''}`}
      >
        {isLoading ? (
          <div className="output-state">
            <div className="output-loader" />
            <p className="output-state-text">AI 正在思考中...</p>
          </div>
        ) : displayText ? (
          <div>
            {displayText}
            {!isComplete && isTyping && <span className="typing-cursor" />}
            {!isComplete && isTyping && (
              <button onClick={skip} className="skip-typing">跳过</button>
            )}
          </div>
        ) : (
          <div className="output-empty">转换后的内容将显示在这里</div>
        )}
      </div>

      {(displayText || outputText) && !isLoading && (
        <div className="output-info">
          <span>{outputLength} 字</span>
          <div className="output-info__actions">
            {isComplete && lastPersonalConversion && (
              <button type="button" className="compare-btn" onClick={openComparison}>
                <SwapOutlined /> 对比默认效果
              </button>
            )}
            <button onClick={handleCopy} className="copy-btn" aria-label="复制结果" title="复制结果">
              <CopyOutlined />
            </button>
          </div>
        </div>
      )}

      <Modal
        title="个人风格效果对比"
        open={comparisonOpen}
        onCancel={() => !comparisonLoading && setComparisonOpen(false)}
        width={960}
        centered
        className="conversion-compare-modal"
        footer={baselineResult ? (
          <button type="button" className="compare-modal-close" onClick={() => setComparisonOpen(false)}>
            关闭
          </button>
        ) : (
          <div className="compare-modal-footer">
            <span>生成默认效果会额外使用 1 次文本转换额度</span>
            <div>
              <button type="button" onClick={() => setComparisonOpen(false)} disabled={comparisonLoading}>取消</button>
              <button type="button" className="is-primary" onClick={() => void generateBaseline()} disabled={comparisonLoading}>
                {comparisonLoading ? '生成中...' : '生成对比（消耗 1 次）'}
              </button>
            </div>
          </div>
        )}
      >
        {baselineResult ? (
          <div className="conversion-compare-grid">
            <section>
              <div className="conversion-compare-heading">
                <div><span>基准</span><strong>仅使用场景语气</strong></div>
                <small>{baselineResult.length} 字</small>
              </div>
              <article>{baselineResult}</article>
              <div className="conversion-compare-actions">
                <button type="button" onClick={() => void copyComparisonResult(baselineResult, '默认结果')}>复制</button>
                <button type="button" className="is-primary" onClick={adoptBaselineResult}>采用此结果</button>
              </div>
            </section>
            <section className="is-personal">
              <div className="conversion-compare-heading">
                <div>
                  <span>个人风格</span>
                  <strong>{lastPersonalConversion?.personalStyleName || '个人风格'}</strong>
                  {lastPersonalConversion?.personalStyleVersion && <small>v{lastPersonalConversion.personalStyleVersion}</small>}
                </div>
                <small>{outputText.length} 字</small>
              </div>
              <article>{outputText}</article>
              <div className="conversion-compare-actions">
                <button type="button" onClick={() => void copyComparisonResult(outputText, '个人风格结果')}>复制</button>
                <button type="button" className="is-primary" onClick={adoptPersonalResult}>采用此结果</button>
              </div>
            </section>
            <div className="conversion-compare-feedback">
              <span>{comparisonPreference ? '偏好已提交，不可修改' : '哪一个效果更好？'}</span>
              <button
                type="button"
                className={comparisonPreference === 'baseline' ? 'active' : ''}
                disabled={comparisonPreference !== null}
                onClick={() => void chooseComparisonPreference('baseline')}
              >
                默认效果更好
              </button>
              <button
                type="button"
                className={comparisonPreference === 'personal' ? 'active' : ''}
                disabled={comparisonPreference !== null}
                onClick={() => void chooseComparisonPreference('personal')}
              >
                个人风格更好
              </button>
            </div>
          </div>
        ) : comparisonLoading ? (
          <div className="conversion-compare-loading"><Spin /><span>正在生成不使用个人风格的基准结果...</span></div>
        ) : (
          <div className="conversion-compare-intro">
            <SwapOutlined />
            <h3>看看个人风格带来了哪些变化</h3>
            <p>系统将使用相同原文和使用场景，再生成一份不应用任何个人风格的结果，并与当前结果并排展示。</p>
            {comparisonError && <span>{comparisonError}</span>}
          </div>
        )}
      </Modal>
    </div>
  );
};
