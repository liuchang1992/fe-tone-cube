import { useMemo, useRef, useState } from 'react';
import {
  CheckOutlined,
  DeleteOutlined,
  DownOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Drawer, Modal, message } from 'antd';

import {
  addManualSensitiveValue,
  detectSensitiveText,
  maskSensitiveText,
  PRIVACY_TYPE_LABELS,
  type PrivacyCandidate,
  type PrivacyEntityType,
  type PrivacyMaskResult,
} from '@/utils/privacyMasking';
import {
  addPrivacyDictionaryTerm,
  loadPrivacyDictionary,
  removePrivacyDictionaryTerm,
  savePrivacyDictionary,
} from '@/utils/privacyDictionary';
import './index.less';

interface PrivacyReviewModalProps {
  open: boolean;
  text: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (result: PrivacyMaskResult) => void;
}

interface CandidateGroup {
  key: string;
  type: PrivacyEntityType;
  value: string;
  candidates: PrivacyCandidate[];
  firstStart: number;
}

export const PrivacyReviewModal = ({
  open,
  text,
  loading,
  onCancel,
  onConfirm,
}: PrivacyReviewModalProps) => {
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [dictionary, setDictionary] = useState<string[]>(loadPrivacyDictionary);
  const [candidates, setCandidates] = useState<PrivacyCandidate[]>(() => (
    detectSensitiveText(text, loadPrivacyDictionary())
  ));
  const [manualValue, setManualValue] = useState('');
  const [selectedSourceText, setSelectedSourceText] = useState('');
  const [saveToDictionary, setSaveToDictionary] = useState(false);
  const [findingSearch, setFindingSearch] = useState('');
  const [onlyUnprotected, setOnlyUnprotected] = useState(false);
  const [collapsedTypes, setCollapsedTypes] = useState<PrivacyEntityType[]>([]);
  const [expandedFindings, setExpandedFindings] = useState<string[]>([]);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionarySearch, setDictionarySearch] = useState('');
  const [dictionarySelection, setDictionarySelection] = useState<string[]>([]);
  const [dictionaryNewTerm, setDictionaryNewTerm] = useState('');

  const result = useMemo(() => maskSensitiveText(text, candidates), [candidates, text]);
  const enabledCount = candidates.filter((item) => item.enabled).length;
  const candidateGroups = useMemo(() => {
    const grouped = new Map<string, CandidateGroup>();
    candidates.forEach((candidate) => {
      const key = `${candidate.type}\u0000${candidate.value}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.candidates.push(candidate);
        existing.firstStart = Math.min(existing.firstStart, candidate.start);
      } else {
        grouped.set(key, {
          key,
          type: candidate.type,
          value: candidate.value,
          candidates: [candidate],
          firstStart: candidate.start,
        });
      }
    });
    return [...grouped.values()].sort((left, right) => left.firstStart - right.firstStart);
  }, [candidates]);
  const protectedGroupCount = candidateGroups.filter((group) => (
    group.candidates.every((candidate) => candidate.enabled)
  )).length;
  const filteredGroups = useMemo(() => {
    const keyword = findingSearch.trim().toLowerCase();
    return candidateGroups.filter((group) => {
      const protectedGroup = group.candidates.every((candidate) => candidate.enabled);
      if (onlyUnprotected && protectedGroup) return false;
      return !keyword
        || group.value.toLowerCase().includes(keyword)
        || PRIVACY_TYPE_LABELS[group.type].includes(keyword);
    });
  }, [candidateGroups, findingSearch, onlyUnprotected]);
  const groupsByType = useMemo(() => {
    const grouped = new Map<PrivacyEntityType, CandidateGroup[]>();
    filteredGroups.forEach((group) => {
      grouped.set(group.type, [...(grouped.get(group.type) || []), group]);
    });
    return [...grouped.entries()];
  }, [filteredGroups]);
  const dictionaryMatchedValues = useMemo(() => new Set(
    dictionary.filter((term) => text.includes(term)),
  ), [dictionary, text]);
  const filteredDictionary = useMemo(() => {
    const keyword = dictionarySearch.trim().toLowerCase();
    return [...dictionary].sort((left, right) => {
      const matchDifference = Number(dictionaryMatchedValues.has(right)) - Number(dictionaryMatchedValues.has(left));
      if (matchDifference) return matchDifference;
      return dictionary.indexOf(right) - dictionary.indexOf(left);
    }).filter((term) => !keyword || term.toLowerCase().includes(keyword));
  }, [dictionary, dictionaryMatchedValues, dictionarySearch]);

  const addManualValue = (value = manualValue) => {
    const normalized = value.trim();
    if (!normalized) {
      message.info('请输入或在原文中选中需要保护的内容');
      return;
    }
    if (!text.includes(normalized)) {
      message.warning('原文中没有找到这段内容');
      return;
    }
    const next = addManualSensitiveValue(text, normalized, candidates);
    const nextDictionary = saveToDictionary
      ? addPrivacyDictionaryTerm(dictionary, normalized)
      : dictionary;
    const candidateAdded = next.length !== candidates.length;
    const dictionaryAdded = nextDictionary.length !== dictionary.length;
    if (!candidateAdded && !dictionaryAdded) {
      message.info('这段内容已经在保护列表中');
      return;
    }
    if (candidateAdded) setCandidates(next);
    if (dictionaryAdded) setDictionary(nextDictionary);
    setManualValue('');
    setSelectedSourceText('');
  };

  const removeDictionaryTerm = (value: string) => {
    setDictionary((current) => removePrivacyDictionaryTerm(current, value));
    setDictionarySelection((current) => current.filter((term) => term !== value));
  };

  const clearDictionary = () => {
    Modal.confirm({
      title: '清空本机敏感词库？',
      content: `将删除当前浏览器保存的 ${dictionary.length} 个词条，本次已经识别出的保护项不会改变。`,
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setDictionary(savePrivacyDictionary([]));
        setDictionarySelection([]);
        message.success('本机敏感词库已清空');
      },
    });
  };

  const addDictionaryNewTerm = () => {
    const value = dictionaryNewTerm.trim();
    if (value.length < 2) {
      message.info('词条至少需要 2 个字符');
      return;
    }
    if (dictionary.includes(value)) {
      message.info('这个词条已经在本机词库中');
      return;
    }
    const nextDictionary = addPrivacyDictionaryTerm(dictionary, value);
    if (!nextDictionary.includes(value)) {
      message.warning('本机词库最多保存 100 个词条');
      return;
    }
    setDictionary(nextDictionary);
    if (text.includes(value)) {
      setCandidates((current) => addManualSensitiveValue(text, value, current).map((candidate) => (
        candidate.value === value && candidate.source === 'manual'
          ? { ...candidate, source: 'dictionary' as const }
          : candidate
      )));
    }
    setDictionaryNewTerm('');
  };

  const deleteSelectedDictionaryTerms = () => {
    if (!dictionarySelection.length) return;
    Modal.confirm({
      title: `删除选中的 ${dictionarySelection.length} 个词条？`,
      content: '只会删除本机词库内容，本次已经识别出的保护项不会改变。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setDictionary((current) => savePrivacyDictionary(
          current.filter((term) => !dictionarySelection.includes(term)),
        ));
        setDictionarySelection([]);
      },
    });
  };

  const setGroupProtection = (group: CandidateGroup, enabled: boolean) => {
    const ids = new Set(group.candidates.map((candidate) => candidate.id));
    setCandidates((current) => current.map((candidate) => (
      ids.has(candidate.id) ? { ...candidate, enabled } : candidate
    )));
  };

  const setAllProtection = (enabled: boolean) => {
    setCandidates((current) => current.map((candidate) => ({ ...candidate, enabled })));
  };

  const toggleCollapsedType = (type: PrivacyEntityType) => {
    setCollapsedTypes((current) => (
      current.includes(type) ? current.filter((value) => value !== type) : [...current, type]
    ));
  };

  const toggleFindingContext = (key: string) => {
    setExpandedFindings((current) => (
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key]
    ));
  };

  const getCandidateContext = (candidate: PrivacyCandidate) => {
    const start = Math.max(0, candidate.start - 18);
    const end = Math.min(text.length, candidate.end + 18);
    return `${start > 0 ? '…' : ''}${text.slice(start, candidate.start)}【${candidate.value}】${text.slice(candidate.end, end)}${end < text.length ? '…' : ''}`;
  };

  const addSelectedText = () => {
    const element = sourceRef.current;
    const currentSelection = element && element.selectionStart !== element.selectionEnd
      ? text.slice(element.selectionStart, element.selectionEnd)
      : '';
    const value = currentSelection || selectedSourceText;
    if (!value) {
      message.info('请先在原文中选中需要保护的内容');
      return;
    }
    addManualValue(value);
  };

  const captureSourceSelection = () => {
    const element = sourceRef.current;
    if (!element || element.selectionStart === element.selectionEnd) return;
    const value = text.slice(element.selectionStart, element.selectionEnd).trim();
    if (!value) return;
    setSelectedSourceText(value);
    setManualValue(value);
  };

  return (
    <Modal
      title={<span className="privacy-review-title"><SafetyCertificateOutlined /> 本地脱敏确认</span>}
      open={open}
      onCancel={() => !loading && onCancel()}
      footer={null}
      width={820}
      centered
      className="privacy-review-modal"
      maskClosable={!loading}
    >
      <div className="privacy-review-intro">
        <LockOutlined />
        <p><strong>敏感字段只在当前浏览器内替换和恢复。</strong>服务端仅接收下方脱敏文本，本次转换不保存历史、不生成效果对比。</p>
      </div>

      <div className="privacy-review-grid">
        <section className="privacy-source-panel">
          <div className="privacy-panel-heading">
            <div><strong>检查原文</strong><span>长按或拖动选中文字，也可以在下方直接输入</span></div>
            <button type="button" onClick={addSelectedText}>
              <PlusOutlined /> {selectedSourceText ? '保护已选内容' : '保护选中文字'}
            </button>
          </div>
          <textarea
            ref={sourceRef}
            value={text}
            readOnly
            aria-label="待脱敏原文"
            onSelect={captureSourceSelection}
          />
          <div className="privacy-manual-add">
            <div>
              <input
                value={manualValue}
                placeholder="输入客户名、公司名、项目名等"
                onChange={(event) => {
                  setManualValue(event.target.value);
                  setSelectedSourceText('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addManualValue();
                  }
                }}
              />
              <button type="button" onClick={() => addManualValue()}>添加保护</button>
            </div>
            <label>
              <input
                type="checkbox"
                checked={saveToDictionary}
                onChange={(event) => setSaveToDictionary(event.target.checked)}
              />
              同时保存到本机词库，以后自动识别
            </label>
          </div>
        </section>

        <section className="privacy-preview-panel">
          <div className="privacy-panel-heading">
            <div><strong>实际发送内容</strong><span>{enabledCount ? `已保护 ${enabledCount} 处` : '尚未选择敏感内容'}</span></div>
          </div>
          <pre>{result.maskedText}</pre>
        </section>
      </div>

      <div className="privacy-findings">
        <div className="privacy-findings__heading">
          <div>
            <strong>保护列表</strong>
            <span>发现 {candidates.length} 处，合并为 {candidateGroups.length} 项，已保护 {protectedGroupCount} 项</span>
          </div>
          <div className="privacy-findings__bulk-actions">
            <button type="button" onClick={() => setAllProtection(true)}>全部保护</button>
            <button type="button" onClick={() => setAllProtection(false)}>全部取消</button>
          </div>
        </div>
        <div className="privacy-findings__tools">
          <label>
            <SearchOutlined />
            <input
              value={findingSearch}
              placeholder="搜索内容或类型"
              onChange={(event) => setFindingSearch(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={onlyUnprotected ? 'is-active' : ''}
            onClick={() => setOnlyUnprotected((current) => !current)}
          >
            只看未保护
          </button>
        </div>
        {groupsByType.length ? (
          <div className="privacy-findings__groups">
            {groupsByType.map(([type, groups]) => {
              const collapsed = collapsedTypes.includes(type);
              const occurrenceCount = groups.reduce((total, group) => total + group.candidates.length, 0);
              return (
                <section key={type} className={collapsed ? 'is-collapsed' : ''}>
                  <button
                    type="button"
                    className="privacy-finding-group-heading"
                    aria-expanded={!collapsed}
                    onClick={() => toggleCollapsedType(type)}
                  >
                    <span><strong>{PRIVACY_TYPE_LABELS[type]}</strong><small>{groups.length} 项 · {occurrenceCount} 处</small></span>
                    <DownOutlined />
                  </button>
                  {!collapsed && (
                    <div className="privacy-finding-group-list">
                      {groups.map((group) => {
                        const protectedGroup = group.candidates.every((candidate) => candidate.enabled);
                        const contextExpanded = expandedFindings.includes(group.key);
                        const sources = new Set(group.candidates.map((candidate) => candidate.source));
                        const fromDictionary = dictionary.includes(group.value);
                        return (
                          <article key={group.key} className={protectedGroup ? 'is-enabled' : ''}>
                            <button
                              type="button"
                              className="privacy-finding-toggle"
                              aria-pressed={protectedGroup}
                              onClick={() => setGroupProtection(group, !protectedGroup)}
                            >
                              <span className="privacy-finding-check">{protectedGroup && <CheckOutlined />}</span>
                              <span className="privacy-finding-main">
                                <strong>{group.value}</strong>
                                <small>
                                  {fromDictionary ? '本机词库' : sources.has('manual') ? '手动添加' : '自动识别'}
                                </small>
                              </span>
                              <span className="privacy-finding-occurrences">出现 {group.candidates.length} 次</span>
                            </button>
                            <button
                              type="button"
                              className="privacy-finding-context-trigger"
                              onClick={() => toggleFindingContext(group.key)}
                            >
                              {contextExpanded ? '收起位置' : '查看位置'}
                            </button>
                            {contextExpanded && (
                              <div className="privacy-finding-contexts">
                                {group.candidates.map((candidate, index) => (
                                  <p key={candidate.id}><b>{index + 1}</b>{getCandidateContext(candidate)}</p>
                                ))}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="privacy-findings__empty">
            {candidates.length
              ? '没有符合当前筛选条件的保护项。'
              : '暂未自动发现敏感字段。你仍可选中原文，或输入客户名、公司名、项目名后添加保护。'}
          </p>
        )}
      </div>

      <div className="privacy-dictionary">
        <div className="privacy-dictionary__heading">
          <div>
            <strong>本机敏感词库</strong>
            <span>{dictionary.length} 条 · 本次命中 {dictionaryMatchedValues.size} 条</span>
          </div>
          <button type="button" onClick={() => setDictionaryOpen(true)}>管理词库</button>
        </div>
        <p>{dictionary.length ? '完整词库已收起，只在保护列表中展示本次命中的词条。' : '手动添加保护内容时，可以选择同时保存到本机词库。'}</p>
      </div>

      <div className="privacy-review-footer">
        <span>{enabledCount ? '请确认上方脱敏文本不再包含需要保护的信息。' : '没有启用保护项，将按隐私模式转换但不会保存历史。'}</span>
        <div>
          <button type="button" onClick={onCancel} disabled={loading}>返回修改</button>
          <button type="button" className="is-primary" onClick={() => onConfirm(result)} disabled={loading}>
            <LockOutlined /> {loading ? '安全转换中...' : '确认并转换'}
          </button>
        </div>
      </div>

      <Drawer
        title={`管理本机敏感词库（${dictionary.length}）`}
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        width={420}
        zIndex={1100}
        className="privacy-dictionary-drawer"
      >
        <p className="privacy-dictionary-drawer__intro">词条只保存在当前浏览器，不会同步到账号或发送给服务端。</p>
        <div className="privacy-dictionary-add">
          <input
            value={dictionaryNewTerm}
            maxLength={100}
            placeholder="添加客户名、项目代号等"
            onChange={(event) => setDictionaryNewTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addDictionaryNewTerm();
              }
            }}
          />
          <button type="button" onClick={addDictionaryNewTerm}><PlusOutlined /> 添加</button>
        </div>
        <div className="privacy-dictionary-toolbar">
          <label><SearchOutlined /><input value={dictionarySearch} placeholder="搜索词条" onChange={(event) => setDictionarySearch(event.target.value)} /></label>
          <button type="button" disabled={!dictionarySelection.length} onClick={deleteSelectedDictionaryTerms}>
            删除选中{dictionarySelection.length ? `（${dictionarySelection.length}）` : ''}
          </button>
        </div>
        {filteredDictionary.length ? (
          <div className="privacy-dictionary-list">
            {filteredDictionary.map((term) => {
              const selected = dictionarySelection.includes(term);
              const matched = dictionaryMatchedValues.has(term);
              return (
                <article key={term} className={matched ? 'is-matched' : ''}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setDictionarySelection((current) => (
                        selected ? current.filter((value) => value !== term) : [...current, term]
                      ))}
                    />
                    <span><strong>{term}</strong><small>{matched ? '本次已命中' : '本次未命中'}</small></span>
                  </label>
                  <button type="button" aria-label={`删除词条${term}`} onClick={() => removeDictionaryTerm(term)}><DeleteOutlined /></button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="privacy-dictionary-list-empty">{dictionary.length ? '没有找到匹配词条。' : '还没有保存词条。'}</p>
        )}
        {dictionary.length > 0 && (
          <button type="button" className="privacy-dictionary-clear" onClick={clearDictionary}>清空全部词条</button>
        )}
      </Drawer>
    </Modal>
  );
};
