import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  HistoryOutlined,
  InboxOutlined,
  HighlightOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Input, Modal, Select, Slider, Spin, Switch, message } from 'antd';

import {
  DEFAULT_DIMENSIONS,
  EMPTY_RULES,
  type MaterialType,
  type PersonalStyle,
  type PersonalStyleVersion,
  type StyleDimensions,
  type StyleMaterial,
  type StylePurpose,
  type StyleRules,
  addFileStyleMaterial,
  addTextStyleMaterial,
  analyzePersonalStyle,
  archivePersonalStyle,
  clearDefaultPersonalStyle,
  deleteStyleMaterial,
  getPersonalStyle,
  getStyleMaterial,
  listStyleMaterials,
  listPersonalStyleVersions,
  restorePersonalStyleVersion,
  savePersonalStyleDetails,
  setDefaultPersonalStyle,
  updatePersonalStyle,
  updateStyleMaterial,
} from '@/api/personalStyles';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatBackendDateTime } from '@/utils/dateTime';
import './PersonalStyleDetail.less';

const PURPOSE_OPTIONS: Array<{ value: StylePurpose; label: string }> = [
  { value: 'general', label: '通用表达' },
  { value: 'daily', label: '日常表达' },
  { value: 'work', label: '职场沟通' },
  { value: 'social_media', label: '自媒体内容' },
  { value: 'brand', label: '品牌文案' },
  { value: 'customer_service', label: '客服沟通' },
  { value: 'other', label: '其他用途' },
];

const MATERIAL_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: 'daily', label: '日常表达' },
  { value: 'moments', label: '朋友圈' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'article', label: '文章/公众号' },
  { value: 'email', label: '商务邮件' },
  { value: 'work_report', label: '工作汇报' },
  { value: 'customer_service', label: '客服回复' },
  { value: 'brand_copy', label: '品牌文案' },
  { value: 'other', label: '其他素材' },
];

const DIMENSION_OPTIONS: Array<{
  key: keyof StyleDimensions;
  label: string;
  low: string;
  high: string;
}> = [
  { key: 'formality', label: '正式程度', low: '随意', high: '正式' },
  { key: 'warmth', label: '亲和程度', low: '克制', high: '亲切' },
  { key: 'concision', label: '简洁程度', low: '展开', high: '精炼' },
  { key: 'emotional_intensity', label: '情绪强度', low: '平静', high: '鲜明' },
  { key: 'directness', label: '表达直接', low: '委婉', high: '直接' },
  { key: 'professionalism', label: '专业程度', low: '日常', high: '专业' },
  { key: 'humor', label: '幽默程度', low: '严肃', high: '幽默' },
  { key: 'marketing_tone', label: '营销感', low: '自然', high: '营销' },
];

const RULE_OPTIONS: Array<{ key: keyof StyleRules; label: string; placeholder: string }> = [
  { key: 'sentence_patterns', label: '句式特点', placeholder: '输入特点后回车，例如：短句为主' },
  { key: 'preferred_phrases', label: '偏好表达', placeholder: '输入常用表达后回车' },
  { key: 'avoided_phrases', label: '禁止使用', placeholder: '输入结果中不能出现的词语' },
  { key: 'organization', label: '组织方式', placeholder: '例如：先结论，后说明原因' },
  { key: 'custom_instructions', label: '补充要求', placeholder: '例如：不要使用空泛客套话' },
  { key: 'protected_terms', label: '保留术语', placeholder: '输入不可改写的品牌词或术语' },
];

const purposeLabel = (purpose: StylePurpose) =>
  PURPOSE_OPTIONS.find((item) => item.value === purpose)?.label || '通用表达';

const materialLabel = (type: MaterialType) =>
  MATERIAL_OPTIONS.find((item) => item.value === type)?.label || '其他素材';

const formatChars = (count: number) => count >= 10000
  ? `${(count / 10000).toFixed(1)} 万字`
  : `${count.toLocaleString()} 字`;

const getProfileFingerprint = (
  summary: string,
  dimensions: StyleDimensions,
  rules: StyleRules,
) => JSON.stringify({
  summary: summary.trim(),
  dimensions: DIMENSION_OPTIONS.map((item) => [item.key, dimensions[item.key]]),
  rules: RULE_OPTIONS.map((item) => [item.key, rules[item.key]]),
});

export const PersonalStyleDetail = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user, setPersonalStyle } = useAppStore();
  const styleId = Number(params.styleId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [style, setStyle] = useState<PersonalStyle | null>(null);
  const [materials, setMaterials] = useState<StyleMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [dimensions, setDimensions] = useState<StyleDimensions>(DEFAULT_DIMENSIONS);
  const [rules, setRules] = useState<StyleRules>(EMPTY_RULES);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedProfileFingerprint, setSavedProfileFingerprint] = useState(
    () => getProfileFingerprint('', DEFAULT_DIMENSIONS, EMPTY_RULES),
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState<StylePurpose>('general');
  const [materialOpen, setMaterialOpen] = useState(false);
  const [materialMode, setMaterialMode] = useState<'text' | 'file'>('text');
  const [materialName, setMaterialName] = useState('');
  const [materialContent, setMaterialContent] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<MaterialType>('other');
  const [representative, setRepresentative] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [viewMaterial, setViewMaterial] = useState<StyleMaterial | null>(null);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versions, setVersions] = useState<PersonalStyleVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PersonalStyleVersion | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  const enoughMaterial = (style?.material_char_count || 0) >= 300;
  const completeness = Math.min(100, Math.round(((style?.material_char_count || 0) / 300) * 100));
  const ruleCount = useMemo(
    () => Object.values(rules).reduce((sum, items) => sum + items.length, 0),
    [rules],
  );
  const profileChanged = useMemo(
    () => getProfileFingerprint(summary, dimensions, rules) !== savedProfileFingerprint,
    [dimensions, rules, savedProfileFingerprint, summary],
  );
  const selectedVersionDimensions = useMemo(
    () => ({ ...DEFAULT_DIMENSIONS, ...(selectedVersion?.dimensions || {}) }),
    [selectedVersion],
  );
  const selectedVersionRules = useMemo(
    () => ({ ...EMPTY_RULES, ...(selectedVersion?.rules || {}) }),
    [selectedVersion],
  );

  const applyStyleDetails = useCallback((nextStyle: PersonalStyle) => {
    const details = nextStyle.details;
    const nextSummary = details?.summary || '';
    const nextDimensions = { ...DEFAULT_DIMENSIONS, ...(details?.dimensions || {}) };
    const nextRules = { ...EMPTY_RULES, ...(details?.rules || {}) };
    setSummary(nextSummary);
    setDimensions(nextDimensions);
    setRules(nextRules);
    setSavedProfileFingerprint(getProfileFingerprint(nextSummary, nextDimensions, nextRules));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStyle, nextMaterials] = await Promise.all([
        getPersonalStyle(styleId),
        listStyleMaterials(styleId),
      ]);
      setStyle(nextStyle);
      setMaterials(nextMaterials);
      applyStyleDetails(nextStyle);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载个人风格失败');
      navigate('/personal-styles', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [applyStyleDetails, navigate, styleId]);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/convert', { replace: true });
      return;
    }
    if (!Number.isInteger(styleId) || styleId <= 0) {
      navigate('/personal-styles', { replace: true });
      return;
    }
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, navigate, styleId, user.isLoggedIn]);

  const refreshStyleAndMaterials = async () => {
    const [nextStyle, nextMaterials] = await Promise.all([
      getPersonalStyle(styleId),
      listStyleMaterials(styleId),
    ]);
    setStyle(nextStyle);
    setMaterials(nextMaterials);
    return nextStyle;
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzePersonalStyle(styleId);
      setSummary(result.summary);
      setDimensions(result.dimensions);
      setRules(result.rules);
      const nextStyle = await refreshStyleAndMaterials();
      applyStyleDetails(nextStyle);
      message.success(`风格画像已更新为版本 ${result.version_number}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '风格分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!enoughMaterial) {
      message.warning('至少需要 300 字素材才能分析；也可以跳过素材，直接编辑左侧配置');
      return;
    }
    const replacesCurrentProfile = Boolean(style?.current_version || profileChanged);
    Modal.confirm({
      title: replacesCurrentProfile
        ? '根据素材重新生成左侧配置？'
        : '根据素材生成左侧配置？',
      content: (
        <div className="psd-analyze-confirm">
          <p>系统会以右侧当前素材为主要依据，生成风格概览、表达维度和表达规则。</p>
          {replacesCurrentProfile && (
            <p className="is-warning">生成结果会替换左侧当前显示的配置；已有历史版本仍会保留。</p>
          )}
          <p>建议先完成素材分析，再在左侧微调并保存。</p>
        </div>
      ),
      okText: replacesCurrentProfile ? '确认重新生成' : '开始生成',
      cancelText: '取消',
      centered: true,
      onOk: runAnalysis,
    });
  };

  const handleSaveDetails = async () => {
    if (!summary.trim()) {
      message.warning('请填写一段总体风格描述');
      return;
    }
    if (!profileChanged) {
      message.info('当前配置与已保存版本一致，无需重复保存');
      return;
    }
    setSaving(true);
    try {
      const result = await savePersonalStyleDetails(styleId, {
        summary: summary.trim(),
        dimensions,
        rules,
      });
      const nextStyle = await refreshStyleAndMaterials();
      applyStyleDetails(nextStyle);
      message.success(`修改已保存为版本 ${result.version_number}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (!style) return;
    setEditName(style.name);
    setEditPurpose(style.purpose);
    setEditOpen(true);
  };

  const handleSaveMeta = async () => {
    if (!editName.trim()) {
      message.warning('风格名称不能为空');
      return;
    }
    try {
      await updatePersonalStyle(styleId, { name: editName.trim(), purpose: editPurpose });
      setEditOpen(false);
      await refreshStyleAndMaterials();
      message.success('基本信息已更新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleArchive = () => {
    Modal.confirm({
      title: '归档这套个人风格？',
      content: '归档后不会删除关联素材，但这套风格将不再出现在转换选择中。',
      okText: '确认归档',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await archivePersonalStyle(styleId);
        message.success('个人风格已归档');
        navigate('/personal-styles', { replace: true });
      },
    });
  };

  const handleSetDefault = () => {
    if (!style) return;
    const clearingDefault = style.is_default;
    Modal.confirm({
      title: clearingDefault ? '取消默认个人风格？' : `将“${style.name}”设为默认风格？`,
      content: clearingDefault
        ? '取消后，进入转换页面时会使用系统的“默认表达”，这套个人风格及其配置不会被删除。'
        : '以后进入转换页面时会优先选中这套个人风格，你仍然可以临时切换为其他风格或默认表达。',
      okText: clearingDefault ? '取消默认' : '设为默认',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        setSettingDefault(true);
        try {
          if (clearingDefault) {
            await clearDefaultPersonalStyle(styleId);
          } else {
            await setDefaultPersonalStyle(styleId);
          }
          const nextStyle = await refreshStyleAndMaterials();
          if (clearingDefault) {
            setPersonalStyle(null);
            message.success('已取消默认个人风格，转换页将使用默认表达');
          } else {
            setPersonalStyle(nextStyle.id, nextStyle.name, nextStyle.current_version);
            message.success('已设为默认个人风格');
          }
        } catch (error) {
          message.error(error instanceof Error ? error.message : '设置默认风格失败');
          throw error;
        } finally {
          setSettingDefault(false);
        }
      },
    });
  };

  const loadVersions = async (preferredVersion?: number) => {
    setVersionsLoading(true);
    try {
      const result = await listPersonalStyleVersions(styleId);
      const nextVersions = result.items.map((item) => ({
        ...item,
        is_current: item.version_number === result.current_version,
      }));
      setVersions(nextVersions);
      setSelectedVersion(
        nextVersions.find((item) => item.version_number === preferredVersion)
        || nextVersions.find((item) => item.is_current)
        || nextVersions[0]
        || null,
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : '版本历史加载失败');
    } finally {
      setVersionsLoading(false);
    }
  };

  const openVersionHistory = () => {
    if (!style) return;
    setVersionOpen(true);
    void loadVersions(style.current_version);
  };

  const confirmRestoreVersion = (version: PersonalStyleVersion) => {
    Modal.confirm({
      title: `恢复版本 ${version.version_number}？`,
      content: (
        <div className="psd-analyze-confirm">
          <p>系统会复制这个历史版本的配置，并保存为一个新的当前版本；已有版本不会被删除。</p>
          {profileChanged && (
            <p className="is-warning">左侧还有未保存的调整，恢复后这些调整会被历史版本替换。</p>
          )}
        </div>
      ),
      okText: '恢复为新版本',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        setRestoringVersion(version.version_number);
        try {
          const result = await restorePersonalStyleVersion(styleId, version.version_number);
          const nextStyle = await refreshStyleAndMaterials();
          applyStyleDetails(nextStyle);
          await loadVersions(result.version_number);
          message.success(
            result.unchanged
              ? '该版本与当前配置一致，无需重复创建版本'
              : `已将版本 ${version.version_number} 恢复为新版本 ${result.version_number}`,
          );
        } catch (error) {
          message.error(error instanceof Error ? error.message : '版本恢复失败');
          throw error;
        } finally {
          setRestoringVersion(null);
        }
      },
    });
  };

  const openAddMaterial = () => {
    setMaterialMode('text');
    setMaterialName('');
    setMaterialContent('');
    setMaterialFile(null);
    setMaterialType('other');
    setRepresentative(false);
    setMaterialOpen(true);
  };

  const handleAddMaterial = async () => {
    if (materialMode === 'text' && materialContent.trim().length < 50) {
      message.warning('粘贴素材至少需要 50 个字符');
      return;
    }
    if (materialMode === 'file' && !materialFile) {
      message.warning('请先选择文件');
      return;
    }
    setAddingMaterial(true);
    try {
      if (materialMode === 'text') {
        await addTextStyleMaterial(styleId, {
          content: materialContent.trim(),
          file_name: materialName.trim() || `粘贴素材 ${materials.length + 1}`,
          material_type: materialType,
          is_representative: representative,
        });
      } else if (materialFile) {
        await addFileStyleMaterial(styleId, materialFile, materialType, representative);
      }
      setMaterialOpen(false);
      await refreshStyleAndMaterials();
      message.success('素材已添加；左侧配置暂未改变，点击“生成/重新分析”后才会更新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '素材添加失败');
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleViewMaterial = async (material: StyleMaterial) => {
    try {
      setViewMaterial(await getStyleMaterial(styleId, material.id));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '素材加载失败');
    }
  };

  const toggleRepresentative = async (material: StyleMaterial) => {
    try {
      await updateStyleMaterial(styleId, material.id, {
        is_representative: !material.is_representative,
      });
      await refreshStyleAndMaterials();
      message.success(material.is_representative ? '已取消代表素材' : '已设为代表素材');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleDeleteMaterial = (material: StyleMaterial) => {
    Modal.confirm({
      title: '删除这份素材？',
      content: `「${material.file_name}」删除后不会影响已经保存的风格版本。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteStyleMaterial(styleId, material.id);
        await refreshStyleAndMaterials();
        message.success('素材已删除');
      },
    });
  };

  if (loading || !style) {
    return (
      <div className="personal-style-detail-page">
        <div className="psd-loading"><Spin size="large" /><span>正在整理风格资料...</span></div>
      </div>
    );
  }

  return (
    <div className="personal-style-detail-page">
      <main className="personal-style-detail-shell">
        <PageHeader
          title={style.name}
          onBack={() => navigate('/personal-styles')}
          action={(
            <div className="psd-header-actions">
              <button
                type="button"
                className={`psd-subtle-button ${style.is_default ? 'is-default' : ''}`}
                disabled={style.current_version <= 0 || settingDefault}
                title={style.current_version <= 0 ? '请先保存一版风格配置' : style.is_default ? '取消默认风格' : undefined}
                onClick={handleSetDefault}
              >
                {style.is_default ? <StarFilled /> : <StarOutlined />}
                {settingDefault ? '处理中' : style.is_default ? '取消默认' : '设为默认'}
              </button>
              {style.current_version > 0 && (
                <button type="button" className="psd-subtle-button" onClick={openVersionHistory}>
                  <HistoryOutlined /> 版本历史
                </button>
              )}
              <button type="button" className="psd-subtle-button" onClick={openEdit}><EditOutlined /> 编辑</button>
              <button type="button" className="psd-danger-link" onClick={handleArchive}>归档</button>
            </div>
          )}
        />

        <section className="psd-overview-card">
          <div className="psd-overview-main">
            <span className="psd-overview-icon"><HighlightOutlined /></span>
            <div>
              <div className="psd-overview-title">
                <h2>{style.name}</h2>
                <span className={style.status === 'active' ? 'is-active' : ''}>
                  {style.status === 'active' ? `已启用 · 版本 ${style.current_version}` : '等待分析'}
                </span>
              </div>
              <p>{purposeLabel(style.purpose)} · {style.material_count} 份素材 · {formatChars(style.material_char_count)}</p>
            </div>
          </div>
          <div className="psd-overview-readiness">
            <div className="psd-readiness-copy">
              <span>素材充分度</span>
              <strong>{enoughMaterial ? '可以分析' : `${completeness}%`}</strong>
            </div>
            <div className="psd-readiness-track"><span style={{ width: `${completeness}%` }} /></div>
            <small>{enoughMaterial ? '素材越丰富，风格越稳定' : `还差 ${Math.max(0, 300 - style.material_char_count)} 字`}</small>
          </div>
          <button
            type="button"
            className="psd-analyze-button"
            onClick={handleAnalyze}
            disabled={!enoughMaterial || analyzing}
          >
            <HighlightOutlined /> {analyzing ? '分析中...' : style.current_version ? '重新分析' : '生成风格画像'}
          </button>
        </section>

        <section className="psd-start-guide" aria-label="个人风格设置说明">
          <div className="psd-start-guide__title">
            <InfoCircleOutlined />
            <div><strong>两种方式都可以建立个人风格</strong><span>选择适合你的方式开始</span></div>
          </div>
          <div className="psd-start-guide__path is-recommended">
            <b>推荐</b>
            <span><strong>用素材生成</strong>：右侧添加本人作品 → 累计至少 300 字 → 点击上方生成画像 → 在左侧微调并保存</span>
          </div>
          <div className="psd-start-guide__path">
            <b>手动</b>
            <span><strong>直接配置</strong>：没有素材也没关系，直接填写左侧概览、维度和规则，然后保存</span>
          </div>
          <p><strong>请注意：</strong>重新分析会优先依据右侧当前素材生成，并替换左侧当前配置。建议先分析素材，再进行手动调整。</p>
        </section>

        <div className="psd-workspace">
          <section className="psd-profile-column">
            <div className="psd-column-label">
              <span>最终生效配置</span>
              <p>这里的内容会用于转换；可以由素材生成，也可以完全手动设置。</p>
            </div>
            <div className="psd-panel psd-summary-panel">
              <div className="psd-panel-heading">
                <div><h2>风格概览</h2><p>可以在 AI 分析后继续修改，让描述更符合你自己。</p></div>
                {style.current_version > 0 && <span>版本 {style.current_version}</span>}
              </div>
              <Input.TextArea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="分析完成后，这里会总结你的整体表达特点。你也可以直接填写。"
                maxLength={2000}
                autoSize={{ minRows: 3, maxRows: 7 }}
                showCount
              />
            </div>

            <div className="psd-panel">
              <div className="psd-panel-heading">
                <div><h2>表达维度</h2><p>数值越靠右，对应特点越明显。</p></div>
              </div>
              <div className="psd-dimension-grid">
                {DIMENSION_OPTIONS.map((item) => (
                  <div className="psd-dimension-item" key={item.key}>
                    <div><strong>{item.label}</strong><span>{dimensions[item.key]}/5</span></div>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={dimensions[item.key]}
                      tooltip={{ open: false }}
                      onChange={(value) => {
                        setDimensions((current) => ({ ...current, [item.key]: value }));
                      }}
                    />
                    <small><span>{item.low}</span><span>{item.high}</span></small>
                  </div>
                ))}
              </div>
            </div>

            <div className="psd-panel">
              <div className="psd-panel-heading">
                <div><h2>表达规则</h2><p>输入后按回车。“禁止使用”和“保留术语”会在转换结果中强制校验。</p></div>
                <span>{ruleCount} 条</span>
              </div>
              <div className="psd-rules-grid">
                {RULE_OPTIONS.map((item) => (
                  <label key={item.key}>
                    <span>{item.label}</span>
                    <Select
                      mode="tags"
                      value={rules[item.key]}
                      placeholder={item.placeholder}
                      tokenSeparators={[',', '，', '\n']}
                      suffixIcon={null}
                      onChange={(value) => {
                        setRules((current) => ({ ...current, [item.key]: value }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="psd-save-row">
                <span>{profileChanged ? '有尚未保存的调整。保存会创建新版本。' : '当前配置与已保存版本一致。'}</span>
                <button
                  type="button"
                  className="psd-save-button"
                  onClick={() => void handleSaveDetails()}
                  disabled={saving || !summary.trim() || !profileChanged}
                  title={!profileChanged ? '修改配置后才能保存新版本' : undefined}
                >
                  <SaveOutlined /> {saving ? '保存中...' : '保存为新版本'}
                </button>
              </div>
            </div>
          </section>

          <aside className="psd-material-column">
            <div className="psd-column-label">
              <span>AI 分析依据</span>
              <p>上传素材不会自动修改左侧；点击生成或重新分析后才会更新。</p>
            </div>
            <div className="psd-panel psd-material-panel">
              <div className="psd-panel-heading psd-material-heading">
                <div><h2>关联素材</h2><p>{materials.length}/20 份 · {formatChars(style.material_char_count)}</p></div>
                <button type="button" onClick={openAddMaterial}><PlusOutlined /> 添加</button>
              </div>
              {materials.length === 0 ? (
                <div className="psd-material-empty">
                  <span><FileAddOutlined /></span>
                  <strong>还没有表达素材</strong>
                  <p>添加你本人写过的内容，建议先准备 2～3 份。</p>
                  <button type="button" onClick={openAddMaterial}>添加第一份素材</button>
                </div>
              ) : (
                <div className="psd-material-list">
                  {materials.map((material) => (
                    <article className="psd-material-item" key={material.id}>
                      <button type="button" className="psd-material-main" onClick={() => void handleViewMaterial(material)}>
                        <span className="psd-material-icon"><FileTextOutlined /></span>
                        <span className="psd-material-copy">
                          <strong>{material.file_name}</strong>
                          <small>{materialLabel(material.material_type)} · {formatChars(material.char_count)}</small>
                          <p>{material.preview || '点击查看素材内容'}</p>
                        </span>
                      </button>
                      <div className="psd-material-actions">
                        <button
                          type="button"
                          className={material.is_representative ? 'is-starred' : ''}
                          title={material.is_representative ? '取消代表素材' : '设为代表素材'}
                          onClick={() => void toggleRepresentative(material)}
                        >
                          {material.is_representative ? <StarFilled /> : <StarOutlined />}
                        </button>
                        <button type="button" title="删除素材" onClick={() => handleDeleteMaterial(material)}>
                          <DeleteOutlined />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="psd-material-tip">
                <StarFilled /> 代表素材会在分析时优先参考。只添加你认可且确实由本人创作的内容。
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        title="风格版本历史"
        open={versionOpen}
        onCancel={() => setVersionOpen(false)}
        footer={null}
        width={820}
        centered
        className="psd-modal psd-version-modal"
      >
        <Spin spinning={versionsLoading}>
          <div className="psd-version-layout">
            <div className="psd-version-list">
              {versions.map((version) => (
                <button
                  type="button"
                  key={version.version_number}
                  className={selectedVersion?.version_number === version.version_number ? 'is-selected' : ''}
                  onClick={() => setSelectedVersion(version)}
                >
                  <span>
                    <strong>版本 {version.version_number}</strong>
                    {version.is_current && <b>当前</b>}
                  </span>
                  <small>{formatBackendDateTime(version.created_at)}</small>
                </button>
              ))}
            </div>
            <div className="psd-version-preview">
              {selectedVersion ? (
                <>
                  <div className="psd-version-preview-heading">
                    <div>
                      <strong>版本 {selectedVersion.version_number}</strong>
                      <span>{formatBackendDateTime(selectedVersion.created_at)}</span>
                    </div>
                    {selectedVersion.is_current && <b>当前使用</b>}
                  </div>
                  <section>
                    <h4>风格概览</h4>
                    <p>{selectedVersion.summary || '暂无风格概览'}</p>
                  </section>
                  <section>
                    <h4>表达维度</h4>
                    <div className="psd-version-dimensions">
                      {DIMENSION_OPTIONS.map((item) => (
                        <span key={item.key}>{item.label}<b>{selectedVersionDimensions[item.key]}/5</b></span>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h4>表达规则</h4>
                    <div className="psd-version-rules">
                      {RULE_OPTIONS.map((item) => selectedVersionRules[item.key].length > 0 && (
                        <div key={item.key}>
                          <strong>{item.label}</strong>
                          <span>{selectedVersionRules[item.key].join(' · ')}</span>
                        </div>
                      ))}
                      {Object.values(selectedVersionRules).every((items) => items.length === 0) && (
                        <p>这个版本没有设置额外规则。</p>
                      )}
                    </div>
                  </section>
                  <div className="psd-version-footer">
                    <span>恢复会创建新版本，不会覆盖历史记录。</span>
                    <button
                      type="button"
                      disabled={selectedVersion.is_current || restoringVersion !== null}
                      onClick={() => confirmRestoreVersion(selectedVersion)}
                    >
                      {restoringVersion === selectedVersion.version_number ? '恢复中...' : '恢复此版本'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="psd-version-empty">暂无可查看的历史版本</div>
              )}
            </div>
          </div>
        </Spin>
      </Modal>

      <Modal
        title="编辑基本信息"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void handleSaveMeta()}
        okText="保存"
        cancelText="取消"
        width={420}
        centered
        className="psd-modal"
      >
        <div className="psd-form-stack">
          <label><span>风格名称</span><Input value={editName} maxLength={100} onChange={(event) => setEditName(event.target.value)} /></label>
          <label><span>主要用途</span><Select value={editPurpose} options={PURPOSE_OPTIONS} onChange={setEditPurpose} /></label>
        </div>
      </Modal>

      <Modal
        title="添加表达素材"
        open={materialOpen}
        onCancel={() => setMaterialOpen(false)}
        onOk={() => void handleAddMaterial()}
        confirmLoading={addingMaterial}
        okText="添加素材"
        cancelText="取消"
        width={640}
        centered
        className="psd-modal psd-material-modal"
      >
        <div className="psd-mode-switch">
          <button type="button" className={materialMode === 'text' ? 'active' : ''} onClick={() => setMaterialMode('text')}>粘贴文字</button>
          <button type="button" className={materialMode === 'file' ? 'active' : ''} onClick={() => setMaterialMode('file')}>上传文件</button>
        </div>
        <div className="psd-material-form-grid">
          <label><span>素材类型</span><Select value={materialType} options={MATERIAL_OPTIONS} onChange={setMaterialType} /></label>
          <label className="psd-switch-label"><span>代表素材</span><Switch checked={representative} onChange={setRepresentative} /></label>
        </div>
        {materialMode === 'text' ? (
          <div className="psd-text-material-form">
            <label><span>素材名称</span><Input value={materialName} placeholder="例如：上周的工作周报" maxLength={128} onChange={(event) => setMaterialName(event.target.value)} /></label>
            <label>
              <span>素材正文 <small>{materialContent.length}/15000</small></span>
              <Input.TextArea value={materialContent} maxLength={15000} autoSize={{ minRows: 8, maxRows: 12 }} placeholder="粘贴一段你本人写过、并且认可其表达方式的内容..." onChange={(event) => setMaterialContent(event.target.value)} />
            </label>
          </div>
        ) : (
          <div
            className={`psd-file-drop ${materialFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) setMaterialFile(file);
            }}
          >
            <InboxOutlined />
            <strong>{materialFile?.name || '点击或拖拽文件到这里'}</strong>
            <span>支持 TXT、DOCX、PDF，单份内容最多 15000 字</span>
            <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf" onChange={(event) => setMaterialFile(event.target.files?.[0] || null)} />
          </div>
        )}
      </Modal>

      <Modal
        title={viewMaterial?.file_name || '素材内容'}
        open={Boolean(viewMaterial)}
        onCancel={() => setViewMaterial(null)}
        footer={null}
        width={680}
        centered
        className="psd-modal"
      >
        {viewMaterial && (
          <div className="psd-material-view">
            <div>
              <span>{materialLabel(viewMaterial.material_type)}</span>
              <span>{formatChars(viewMaterial.char_count)}</span>
              <span>{formatBackendDateTime(viewMaterial.created_at)}</span>
              {viewMaterial.is_representative && <span className="is-representative"><StarFilled /> 代表素材</span>}
            </div>
            <article>{viewMaterial.content}</article>
          </div>
        )}
      </Modal>
    </div>
  );
};
