import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRightOutlined,
  BulbOutlined,
  FileTextOutlined,
  PlusOutlined,
  SoundOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Input, Modal, Select, message } from 'antd';

import {
  type PersonalStyle,
  type StylePurpose,
  clearDefaultPersonalStyle,
  createPersonalStyle,
  listPersonalStyles,
  setDefaultPersonalStyle,
} from '@/api/personalStyles';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useAppStore } from '@/store/appStore';
import './PersonalStyles.less';

const PURPOSE_OPTIONS: Array<{ value: StylePurpose; label: string }> = [
  { value: 'general', label: '通用表达' },
  { value: 'daily', label: '日常表达' },
  { value: 'work', label: '职场沟通' },
  { value: 'social_media', label: '自媒体内容' },
  { value: 'brand', label: '品牌文案' },
  { value: 'customer_service', label: '客服沟通' },
  { value: 'other', label: '其他用途' },
];

const MAX_PERSONAL_STYLES = 3;

const purposeLabel = (purpose: StylePurpose) =>
  PURPOSE_OPTIONS.find((item) => item.value === purpose)?.label || '通用表达';

const formatChars = (count: number) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)} 万字`;
  return `${count.toLocaleString()} 字`;
};

export const PersonalStyles = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldAutoOpenCreate = searchParams.get('create') === '1';
  const { user, setPersonalStyle } = useAppStore();
  const [styles, setStyles] = useState<PersonalStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(shouldAutoOpenCreate);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<StylePurpose>('general');
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const totals = useMemo(() => ({
    materials: styles.reduce((sum, item) => sum + item.material_count, 0),
    active: styles.filter((item) => item.status === 'active').length,
  }), [styles]);

  useEffect(() => {
    if (!shouldAutoOpenCreate) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shouldAutoOpenCreate]);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate('/convert', { replace: true });
      return;
    }
    const loadStyles = async () => {
      setLoading(true);
      try {
        setStyles(await listPersonalStyles());
      } catch (error) {
        message.error(error instanceof Error ? error.message : '加载个人风格失败');
      } finally {
        setLoading(false);
      }
    };
    void loadStyles();
  }, [navigate, user.isLoggedIn]);

  const openCreate = () => {
    if (styles.length >= MAX_PERSONAL_STYLES) {
      message.warning(`每个账号最多创建 ${MAX_PERSONAL_STYLES} 套个人风格；可以先停用不再使用的风格`);
      return;
    }
    setName('');
    setPurpose('general');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (styles.length >= MAX_PERSONAL_STYLES) {
      message.warning(`每个账号最多创建 ${MAX_PERSONAL_STYLES} 套个人风格`);
      setCreateOpen(false);
      return;
    }
    const nextName = name.trim();
    if (!nextName) {
      message.warning('请先给这套风格起一个名字');
      return;
    }
    setCreating(true);
    try {
      const created = await createPersonalStyle(nextName, purpose);
      message.success('个人风格已创建，接下来添加一些你的作品');
      setCreateOpen(false);
      navigate(`/personal-styles/${created.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleSetDefault = async (style: PersonalStyle) => {
    if (style.current_version <= 0) return;
    setSettingDefaultId(style.id);
    try {
      if (style.is_default) {
        await clearDefaultPersonalStyle(style.id);
      } else {
        await setDefaultPersonalStyle(style.id);
      }
      setStyles((current) => current
        .map((item) => ({ ...item, is_default: style.is_default ? false : item.id === style.id }))
        .sort((first, second) => Number(second.is_default) - Number(first.is_default)));
      if (style.is_default) {
        setPersonalStyle(null);
        message.success('已取消默认个人风格，转换页将使用默认表达');
      } else {
        setPersonalStyle(style.id, style.name, style.current_version);
        message.success(`已将“${style.name}”设为默认风格`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '设置默认风格失败');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="personal-styles-page">
      <main className="personal-styles-shell">
        <PageHeader
          title="个人风格"
          onBack={() => navigate('/convert')}
          action={(
            <button
              type="button"
              className="ps-primary-button ps-primary-button--compact"
              onClick={openCreate}
              disabled={!loading && styles.length >= MAX_PERSONAL_STYLES}
              title={!loading && styles.length >= MAX_PERSONAL_STYLES ? `最多创建 ${MAX_PERSONAL_STYLES} 套个人风格` : undefined}
            >
              <PlusOutlined /> 新建风格
            </button>
          )}
        />

        <section className="ps-intro-card">
          <div className="ps-intro-copy">
            <span className="ps-eyebrow"><SoundOutlined /> 你的表达资产</span>
            <h2>让每次改写，都保留你的语言习惯</h2>
            <p>为不同身份建立风格，添加你亲自写过的内容，魔方会提炼用词、句式和表达分寸。</p>
          </div>
          <div className="ps-intro-stats">
            <div><strong>{styles.length}</strong><span>风格</span></div>
            <div><strong>{totals.materials}</strong><span>素材</span></div>
            <div><strong>{totals.active}</strong><span>已启用</span></div>
          </div>
        </section>

        <div className="ps-section-heading">
          <div>
            <h2>我的风格</h2>
            <p>添加一份至少 50 字的关联素材即可分析（累计 300 字以上分析相对稳定）。</p>
          </div>
        </div>

        {loading ? (
          <div className="ps-loading-grid">
            {[1, 2, 3, 4].map((item) => <span key={item} />)}
          </div>
        ) : styles.length === 0 ? (
          <section className="ps-empty-state">
            <span className="ps-empty-icon"><BulbOutlined /></span>
            <h2>创建你的第一套个人风格</h2>
            <p>可以从“我的日常表达”或“我的职场表达”开始，稍后再添加更多风格。</p>
            <button type="button" className="ps-primary-button" onClick={openCreate}>
              <PlusOutlined /> 创建个人风格
            </button>
          </section>
        ) : (
          <section className="ps-style-grid">
            {styles.map((style) => {
              const ready = style.status === 'active';
              const progress = Math.min(100, Math.round((style.material_char_count / 300) * 100));
              return (
                <article
                  className="ps-style-card"
                  key={style.id}
                >
                  <button
                    type="button"
                    className="ps-style-card__open"
                    aria-label={`打开${style.name}`}
                    onClick={() => navigate(`/personal-styles/${style.id}`)}
                  />
                  <div className="ps-style-card__top">
                    <span className="ps-style-card__icon"><FileTextOutlined /></span>
                    <div className="ps-style-card__top-actions">
                      <span className={`ps-status-pill ${ready ? 'ps-status-pill--ready' : ''}`}>
                        {ready ? `版本 ${style.current_version}` : '待分析'}
                      </span>
                      <button
                        type="button"
                        className={`ps-default-action ${style.is_default ? 'is-default' : ''}`}
                        disabled={!ready || settingDefaultId !== null}
                        title={!ready ? '请先完成并保存风格配置' : style.is_default ? '取消默认风格' : '设为默认风格'}
                        onClick={() => void handleSetDefault(style)}
                      >
                        {style.is_default ? <StarFilled /> : <StarOutlined />}
                        {settingDefaultId === style.id
                          ? '处理中'
                          : style.is_default ? '取消默认' : '设为默认'}
                      </button>
                    </div>
                  </div>
                  <div className="ps-style-card__body">
                    <div className="ps-style-card__title">
                      <h3>{style.name}</h3>
                    </div>
                    <p>{purposeLabel(style.purpose)}</p>
                  </div>
                  <div className="ps-style-card__progress">
                    <div><span style={{ width: `${ready ? 100 : progress}%` }} /></div>
                    <small>{ready ? '风格画像已启用' : `${formatChars(style.material_char_count)} / 建议 300 字（累计 300 字以上分析相对稳定）`}</small>
                  </div>
                  <div className="ps-style-card__footer">
                    <span>{style.material_count} 份素材 · {formatChars(style.material_char_count)}</span>
                    <ArrowRightOutlined />
                  </div>
                </article>
              );
            })}
            {styles.length < MAX_PERSONAL_STYLES && (
              <button type="button" className="ps-style-card ps-style-card--add" onClick={openCreate}>
                <span><PlusOutlined /></span>
                <strong>新建一套风格</strong>
                <small>最多可创建 {MAX_PERSONAL_STYLES} 套</small>
              </button>
            )}
          </section>
        )}
      </main>

      <Modal
        title="新建个人风格"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        confirmLoading={creating}
        okText="创建并添加素材"
        cancelText="取消"
        centered
        width={440}
        className="ps-modal"
      >
        <div className="ps-form-stack">
          <label>
            <span>风格名称</span>
            <Input
              value={name}
              maxLength={100}
              placeholder="例如：我的职场表达"
              onChange={(event) => setName(event.target.value)}
              onPressEnter={() => void handleCreate()}
              autoFocus
            />
          </label>
          <label>
            <span>主要用途</span>
            <Select value={purpose} options={PURPOSE_OPTIONS} onChange={setPurpose} />
          </label>
          <p>用途只是帮助系统理解素材，不会限制这套风格以后能用在哪些场景。</p>
        </div>
      </Modal>
    </div>
  );
};
