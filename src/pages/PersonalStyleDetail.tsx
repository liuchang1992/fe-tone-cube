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
  MoreOutlined,
  PlusOutlined,
  SaveOutlined,
  StarFilled,
  StarOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, Modal, Select, Slider, Spin, Switch, message } from 'antd';

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
  type StylePreviewScene,
  type StylePreviewStrength,
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
  previewPersonalStyle,
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

const PREVIEW_SCENE_OPTIONS: Array<{ value: StylePreviewScene; label: string }> = [
  { value: 'formal', label: '职场汇报' },
  { value: 'email', label: '邮件沟通' },
  { value: 'concise', label: '简洁直接' },
  { value: 'polite', label: '温和礼貌' },
  { value: 'wechat', label: '微信聊天' },
  { value: 'marketing', label: '营销文案' },
  { value: 'customer_service', label: '客户沟通' },
  { value: 'xiaohongshu', label: '小红书种草' },
  { value: 'short_video', label: '短视频口播' },
  { value: 'academic', label: '专业严谨' },
  { value: 'moments', label: '朋友圈分享' },
  { value: 'government', label: '政务汇报' },
  { value: 'business', label: '商务沟通' },
  { value: 'research', label: '科研表达' },
  { value: 'paper', label: '论文写作' },
];

const PREVIEW_STRENGTH_OPTIONS: Array<{ value: StylePreviewStrength; label: string }> = [
  { value: 'light', label: '仅润色' },
  { value: 'standard', label: '常规改写' },
  { value: 'deep', label: '结构重组' },
];

const MAX_STYLE_MATERIALS = 5;
const MIN_STYLE_MATERIAL_CHARS = 50;
const MAX_STYLE_MATERIAL_CHARS = 5000;
const MAX_STYLE_TOTAL_CHARS = 12000;
const RECOMMENDED_STYLE_MATERIAL_CHARS = 300;
const MATERIAL_STABILITY_HINT = '（累计 300 字以上分析相对稳定）';

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

type TextRuleKey = Exclude<keyof StyleRules, 'structure_rules'>;

const RULE_OPTIONS: Array<{ key: TextRuleKey; label: string; placeholder: string }> = [
  { key: 'sentence_patterns', label: '句式特点', placeholder: '输入特点后回车，例如：短句为主' },
  { key: 'preferred_phrases', label: '偏好表达', placeholder: '输入常用表达后回车' },
  { key: 'avoided_phrases', label: '禁止使用', placeholder: '输入结果中不能出现的词语' },
  { key: 'organization', label: '组织方式', placeholder: '例如：先结论，后说明原因' },
  { key: 'custom_instructions', label: '补充要求', placeholder: '例如：不要使用空泛客套话' },
  { key: 'protected_terms', label: '保留术语', placeholder: '输入不可改写的品牌词或术语' },
];

const STRUCTURE_ELEMENT_LABELS: Record<StyleRules['structure_rules'][number]['element'], string> = {
  date: '日期',
  heading: '标题',
  greeting: '称呼',
  signature: '落款',
  bullet: '项目符号',
  numbering: '编号',
  separator: '分隔符',
  emoji: 'Emoji',
  hashtag: '话题标签',
  custom: '其他结构',
};

const STRUCTURE_FREQUENCY_LABELS: Record<StyleRules['structure_rules'][number]['frequency'], string> = {
  once: '全文一次',
  once_per_group: '每组一次',
  once_per_item: '每项一次',
  optional: '按需出现',
  repeated: '允许重复',
};

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
  structure_rules: rules.structure_rules,
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
  const [previewText, setPreviewText] = useState('');
  const [previewResult, setPreviewResult] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScene, setPreviewScene] = useState<StylePreviewScene>('formal');
  const [previewStrength, setPreviewStrength] = useState<StylePreviewStrength>('standard');
  const [previewProfileFingerprint, setPreviewProfileFingerprint] = useState('');

  const materialCharCount = style?.material_char_count || 0;
  const hasAnalyzableMaterial = materialCharCount >= MIN_STYLE_MATERIAL_CHARS;
  const materialReferenceProgress = Math.min(
    100,
    Math.round((materialCharCount / RECOMMENDED_STYLE_MATERIAL_CHARS) * 100),
  );
  const ruleCount = useMemo(
    () => Object.values(rules).reduce((sum, items) => sum + items.length, 0),
    [rules],
  );
  const profileChanged = useMemo(
    () => getProfileFingerprint(summary, dimensions, rules) !== savedProfileFingerprint,
    [dimensions, rules, savedProfileFingerprint, summary],
  );
  const currentProfileFingerprint = useMemo(
    () => getProfileFingerprint(summary, dimensions, rules),
    [dimensions, rules, summary],
  );
  const previewIsStale = Boolean(
    previewResult && previewProfileFingerprint !== currentProfileFingerprint,
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
    if (!hasAnalyzableMaterial) {
      message.warning(`请先添加一份至少 ${MIN_STYLE_MATERIAL_CHARS} 字的关联素材${MATERIAL_STABILITY_HINT}；也可以直接编辑最终配置`);
      return;
    }
    const replacesCurrentProfile = Boolean(style?.current_version || profileChanged);
    Modal.confirm({
      title: replacesCurrentProfile
        ? '根据关联素材重新生成最终配置？'
        : '根据关联素材生成最终配置？',
      content: (
        <div className="psd-analyze-confirm">
          <p>系统会以当前关联素材为主要依据，生成风格概览、表达维度和表达规则。</p>
          {replacesCurrentProfile && (
            <p className="is-warning">生成结果会替换最终配置区当前显示的内容；已有历史版本仍会保留。</p>
          )}
          {/* <p>建议先完成关联素材分析，再到最终配置区微调并保存。</p> */}
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

  const handlePreview = async () => {
    if (!summary.trim()) {
      message.warning('请先填写风格概览，再进行试写');
      return;
    }
    if (!previewText.trim()) {
      message.warning('请输入一段要试写的原文');
      return;
    }
    setPreviewing(true);
    try {
      const result = await previewPersonalStyle(styleId, {
        text: previewText.trim(),
        style: previewScene,
        rewrite_strength: previewStrength,
        details: { summary: summary.trim(), dimensions, rules },
      });
      setPreviewResult(result.result);
      setPreviewProfileFingerprint(currentProfileFingerprint);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '试写失败');
    } finally {
      setPreviewing(false);
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
      title: '停用这套个人风格？',
      content: '停用后，这套风格将不再出现在个人风格列表和转换选择中；关联素材与历史版本仍会保留。',
      okText: '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await archivePersonalStyle(styleId);
        message.success('个人风格已停用');
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
            <p className="is-warning">最终配置区还有未保存的调整，恢复后这些调整会被历史版本替换。</p>
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
    if (!style) return;
    if (materials.length >= MAX_STYLE_MATERIALS) {
      message.warning(`每套个人风格最多添加 ${MAX_STYLE_MATERIALS} 份关联素材，请先删除不具代表性的素材`);
      return;
    }
    if (style.material_char_count >= MAX_STYLE_TOTAL_CHARS) {
      message.warning(`关联素材总字数已达到 ${MAX_STYLE_TOTAL_CHARS} 字，请先精简现有素材`);
      return;
    }
    setMaterialMode('text');
    setMaterialName('');
    setMaterialContent('');
    setMaterialFile(null);
    setMaterialType('other');
    setRepresentative(false);
    setMaterialOpen(true);
  };

  const handleAddMaterial = async () => {
    if (!style) return;
    if (materialMode === 'text' && materialContent.trim().length < MIN_STYLE_MATERIAL_CHARS) {
      message.warning(`粘贴的关联素材至少需要 ${MIN_STYLE_MATERIAL_CHARS} 个字符${MATERIAL_STABILITY_HINT}`);
      return;
    }
    if (materialMode === 'text' && materialContent.trim().length > MAX_STYLE_MATERIAL_CHARS) {
      message.warning(`单份关联素材最多支持 ${MAX_STYLE_MATERIAL_CHARS} 字`);
      return;
    }
    if (
      materialMode === 'text'
      && style.material_char_count + materialContent.trim().length > MAX_STYLE_TOTAL_CHARS
    ) {
      message.warning(`关联素材合计最多支持 ${MAX_STYLE_TOTAL_CHARS} 字，请缩短本次内容`);
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
          file_name: materialName.trim() || `关联素材 ${materials.length + 1}`,
          material_type: materialType,
          is_representative: representative,
        });
      } else if (materialFile) {
        await addFileStyleMaterial(styleId, materialFile, materialType, representative);
      }
      setMaterialOpen(false);
      await refreshStyleAndMaterials();
      message.success('关联素材已添加；最终配置暂未改变，点击“生成/重新分析”后才会更新');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关联素材添加失败');
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleViewMaterial = async (material: StyleMaterial) => {
    try {
      setViewMaterial(await getStyleMaterial(styleId, material.id));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关联素材加载失败');
    }
  };

  const toggleRepresentative = async (material: StyleMaterial) => {
    try {
      await updateStyleMaterial(styleId, material.id, {
        is_representative: !material.is_representative,
      });
      await refreshStyleAndMaterials();
      message.success(material.is_representative ? '已取消优先参考' : '已设为优先参考的关联素材');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleDeleteMaterial = (material: StyleMaterial) => {
    Modal.confirm({
      title: '删除这份关联素材？',
      content: `「${material.file_name}」删除后不会影响已经保存的风格版本。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteStyleMaterial(styleId, material.id);
        await refreshStyleAndMaterials();
        message.success('关联素材已删除');
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
            <>
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
                <button type="button" className="psd-danger-link" onClick={handleArchive}>停用</button>
              </div>
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'default',
                      icon: style.is_default ? <StarFilled /> : <StarOutlined />,
                      label: settingDefault ? '处理中...' : style.is_default ? '取消默认' : '设为默认',
                      disabled: style.current_version <= 0 || settingDefault,
                    },
                    {
                      key: 'history',
                      icon: <HistoryOutlined />,
                      label: '版本历史',
                      disabled: style.current_version <= 0,
                    },
                    { key: 'edit', icon: <EditOutlined />, label: '编辑基本信息' },
                    { type: 'divider' },
                    { key: 'archive', icon: <StopOutlined />, label: '停用个人风格', danger: true },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'default') handleSetDefault();
                    if (key === 'history') openVersionHistory();
                    if (key === 'edit') openEdit();
                    if (key === 'archive') handleArchive();
                  },
                }}
              >
                <button type="button" className="psd-mobile-header-menu" aria-label="更多个人风格操作">
                  <MoreOutlined /> 更多
                </button>
              </Dropdown>
            </>
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
              <p>{purposeLabel(style.purpose)} · {style.material_count} 份关联素材 · {formatChars(style.material_char_count)}</p>
            </div>
          </div>
          <div className="psd-overview-readiness">
            <div className="psd-readiness-copy">
              <span>关联素材参考量</span>
              <strong>{formatChars(style.material_char_count)}</strong>
            </div>
            <div className="psd-readiness-track"><span style={{ width: `${materialReferenceProgress}%` }} /></div>
            <small>
              {!hasAnalyzableMaterial
                ? `添加一份至少 ${MIN_STYLE_MATERIAL_CHARS} 字的素材即可分析${MATERIAL_STABILITY_HINT}`
                : style.material_char_count < RECOMMENDED_STYLE_MATERIAL_CHARS
                  ? `已可分析${MATERIAL_STABILITY_HINT}`
                  : '素材较充分，可继续添加更具代表性的内容'}
            </small>
          </div>
          <button
            type="button"
            className="psd-analyze-button"
            onClick={handleAnalyze}
            disabled={!hasAnalyzableMaterial || analyzing}
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
            <span><strong>用关联素材生成</strong>：添加一份至少 {MIN_STYLE_MATERIAL_CHARS} 字的本人作品{MATERIAL_STABILITY_HINT} → 有多少分析多少 → 在最终配置区微调并保存</span>
          </div>
          <div className="psd-start-guide__path">
            <b>手动</b>
            <span><strong>直接配置</strong>：没有关联素材也没关系，直接填写最终配置区的概览、维度和规则，然后保存</span>
          </div>
          <p><strong>请注意：</strong>重新分析会优先依据当前关联素材生成，并替换最终配置区的当前内容。建议先分析关联素材，再进行手动调整。</p>
        </section>

        <div className="psd-workspace">
          <section className="psd-profile-column">
            <div className="psd-column-label">
              <span>最终生效配置</span>
              <p>这里的内容会用于转换；可以由关联素材生成，也可以完全手动设置。</p>
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
              {rules.structure_rules.length > 0 && (
                <div className="psd-structure-rules">
                  <div className="psd-structure-rules__heading">
                    <div>
                      <strong>结构规则</strong>
                      <span>由关联素材分析生成，用于控制标题、日期、称呼、落款等元素的位置和重复范围。</span>
                    </div>
                    <b>{rules.structure_rules.length} 条</b>
                  </div>
                  <div className="psd-structure-rules__list">
                    {rules.structure_rules.map((rule, index) => (
                      <article key={`${rule.element}-${rule.position}-${index}`}>
                        <div>
                          <span>{STRUCTURE_ELEMENT_LABELS[rule.element]}</span>
                          <span>{STRUCTURE_FREQUENCY_LABELS[rule.frequency]}</span>
                          {rule.pattern && <code>{rule.pattern}</code>}
                        </div>
                        <p>{rule.instruction}</p>
                        <button
                          type="button"
                          title="移除这条结构规则"
                          onClick={() => setRules((current) => ({
                            ...current,
                            structure_rules: current.structure_rules.filter((_, itemIndex) => itemIndex !== index),
                          }))}
                        >
                          <DeleteOutlined />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              <div className="psd-save-row">
                <span>{profileChanged ? '有尚未保存的调整。保存会创建新版本。' : '当前配置与已保存版本一致。'}</span>
                <div className="psd-save-actions">
                  <button
                    type="button"
                    className="psd-preview-trigger"
                    disabled={!summary.trim()}
                    title={!summary.trim() ? '请先填写风格概览' : '使用页面当前配置试写'}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <ThunderboltOutlined /> 试写效果
                  </button>
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
            </div>
          </section>

          <aside className="psd-material-column">
            <div className="psd-column-label">
              <span>AI 分析依据</span>
              <p>添加关联素材不会自动修改最终配置；点击生成或重新分析后才会更新。</p>
            </div>
            <div className="psd-panel psd-material-panel">
              <div className="psd-panel-heading psd-material-heading">
                <div><h2>关联素材</h2><p>{materials.length}/{MAX_STYLE_MATERIALS} 份 · {formatChars(style.material_char_count)}/{formatChars(MAX_STYLE_TOTAL_CHARS)}</p></div>
                <button type="button" onClick={openAddMaterial} disabled={materials.length >= MAX_STYLE_MATERIALS || style.material_char_count >= MAX_STYLE_TOTAL_CHARS}><PlusOutlined /> 添加</button>
              </div>
              {materials.length === 0 ? (
                <div className="psd-material-empty">
                  <span><FileAddOutlined /></span>
                  <strong>还没有关联素材</strong>
                  <p>添加你本人写过的内容作为分析依据，建议准备 2～5 份代表素材，系统会完整分析。</p>
                  <button type="button" onClick={openAddMaterial}>添加第一份关联素材</button>
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
                          <p>{material.preview || '点击查看关联素材内容'}</p>
                        </span>
                      </button>
                      <div className="psd-material-actions">
                        <button
                          type="button"
                          className={material.is_representative ? 'is-starred' : ''}
                          title={material.is_representative ? '取消优先参考' : '设为优先参考的关联素材'}
                          onClick={() => void toggleRepresentative(material)}
                        >
                          {material.is_representative ? <StarFilled /> : <StarOutlined />}
                        </button>
                        <button type="button" title="删除关联素材" onClick={() => handleDeleteMaterial(material)}>
                          <DeleteOutlined />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="psd-material-tip">
                <StarFilled /> 系统会完整分析全部关联素材；“优先参考”用于强调其中最能代表你的内容。
              </div>
              <button
                type="button"
                className="psd-mobile-analyze-button"
                onClick={handleAnalyze}
                disabled={!hasAnalyzableMaterial || analyzing}
              >
                <HighlightOutlined />
                {analyzing
                  ? '分析中...'
                  : style.current_version
                    ? '根据当前关联素材重新分析'
                    : hasAnalyzableMaterial
                      ? '根据当前关联素材生成风格画像'
                      : `添加至少 ${MIN_STYLE_MATERIAL_CHARS} 字的关联素材后可分析${MATERIAL_STABILITY_HINT}`}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        title="试写当前风格"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={760}
        centered
        destroyOnHidden={false}
        className="psd-modal psd-preview-modal"
      >
        <div className="psd-preview-modal__intro">
          <span><ThunderboltOutlined /></span>
          <p>直接使用页面当前配置，不必先保存。试写不会创建版本，也不会写入历史。</p>
        </div>
        <div className="psd-preview-controls">
          <label>
            <span>使用场景</span>
            <Select value={previewScene} options={PREVIEW_SCENE_OPTIONS} onChange={setPreviewScene} />
          </label>
          <label>
            <span>改写方式</span>
            <Select
              value={previewStrength}
              options={PREVIEW_STRENGTH_OPTIONS}
              onChange={setPreviewStrength}
            />
          </label>
          <button
            type="button"
            className="psd-preview-button"
            disabled={previewing || !previewText.trim() || !summary.trim()}
            onClick={() => void handlePreview()}
          >
            <ThunderboltOutlined /> {previewing ? '试写中...' : previewResult ? '重新试写' : '开始试写'}
          </button>
        </div>
        <div className="psd-preview-workspace">
          <label>
            <span>原文</span>
            <Input.TextArea
              value={previewText}
              maxLength={1000}
              showCount
              placeholder="输入一小段熟悉的内容，更容易判断这套风格像不像你。"
              onChange={(event) => setPreviewText(event.target.value)}
            />
          </label>
          <div className="psd-preview-result">
            <div>
              <span>试写结果</span>
              {previewResult && (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(previewResult);
                    message.success('试写结果已复制');
                  }}
                >
                  复制
                </button>
              )}
            </div>
            {previewing ? (
              <div className="psd-preview-loading"><Spin size="small" /><span>正在按当前配置试写...</span></div>
            ) : previewResult ? (
              <p>{previewResult}</p>
            ) : (
              <p className="is-empty">结果会显示在这里，方便你边试边调整。</p>
            )}
          </div>
        </div>
        <div className={`psd-preview-footnote ${previewIsStale ? 'is-stale' : ''}`}>
          {previewIsStale
            ? '页面配置在上次试写后有变化，请重新试写查看最新效果。'
            : '每次试写会使用 1 次文本转换额度；试写结果仅用于预览。'}
        </div>
      </Modal>

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
                      {selectedVersionRules.structure_rules.map((rule, index) => (
                        <div key={`structure-${rule.element}-${index}`}>
                          <strong>结构·{STRUCTURE_ELEMENT_LABELS[rule.element]}</strong>
                          <span>{rule.instruction}</span>
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
        title="添加关联素材"
        open={materialOpen}
        onCancel={() => setMaterialOpen(false)}
        onOk={() => void handleAddMaterial()}
        confirmLoading={addingMaterial}
        okText="添加关联素材"
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
          <label><span>关联素材类型</span><Select value={materialType} options={MATERIAL_OPTIONS} onChange={setMaterialType} /></label>
          <label className="psd-switch-label"><span>优先参考</span><Switch checked={representative} onChange={setRepresentative} /></label>
        </div>
        {materialMode === 'text' ? (
          <div className="psd-text-material-form">
            <label><span>关联素材名称</span><Input value={materialName} placeholder="例如：上周的工作周报" maxLength={128} onChange={(event) => setMaterialName(event.target.value)} /></label>
            <label>
              <span>关联素材正文（至少 {MIN_STYLE_MATERIAL_CHARS} 字）{MATERIAL_STABILITY_HINT} <small>{materialContent.length}/{MAX_STYLE_MATERIAL_CHARS}</small></span>
              <Input.TextArea value={materialContent} maxLength={MAX_STYLE_MATERIAL_CHARS} autoSize={{ minRows: 8, maxRows: 12 }} placeholder={`粘贴一段至少 ${MIN_STYLE_MATERIAL_CHARS} 字、由你本人写过且认可其表达方式的内容...`} onChange={(event) => setMaterialContent(event.target.value)} />
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
            <span>支持 TXT、DOCX、PDF，单份 {MIN_STYLE_MATERIAL_CHARS}～{MAX_STYLE_MATERIAL_CHARS} 字{MATERIAL_STABILITY_HINT}，全部素材都会完整分析</span>
            <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf" onChange={(event) => setMaterialFile(event.target.files?.[0] || null)} />
          </div>
        )}
      </Modal>

      <Modal
        title={viewMaterial?.file_name || '关联素材内容'}
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
              {viewMaterial.is_representative && <span className="is-representative"><StarFilled /> 优先参考</span>}
            </div>
            <article>{viewMaterial.content}</article>
          </div>
        )}
      </Modal>
    </div>
  );
};
