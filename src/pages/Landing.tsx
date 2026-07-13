import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { trackFeature } from '@/api/analytics';
import emailIcon from '@/assets/emaill.png';
import greetIcon from '@/assets/greet.png';
import heroImage from '@/assets/hero.png';
import workIcon from '@/assets/work.png';
import xhsIcon from '@/assets/xhs.png';
import './Landing.less';


const CAPABILITIES = [
  {
    icon: <ThunderboltOutlined />,
    title: '文案语气转换',
    description: '保留原意，快速切换正式、简洁、亲切等表达方式，让每段文字更适合使用场景。',
    meta: '最多 2000 字符',
  },
  {
    icon: <FileTextOutlined />,
    title: '整篇文档转换',
    description: '上传 TXT、DOCX 或 PDF，后台分段处理长内容，完成后可直接预览和下载。',
    meta: '最多 15000 字符',
  },
  {
    icon: <BookOutlined />,
    title: '学习你的表达风格',
    description: '分析代表性语料中的用词、句式和节奏，沉淀属于你的个人表达特征。',
    meta: '每日 3 次分析',
  },
];

const SCENES = [
  { icon: xhsIcon, title: '社交媒体', description: '小红书、朋友圈与内容平台' },
  { icon: workIcon, title: '职场表达', description: '汇报、通知与商务沟通' },
  { icon: emailIcon, title: '邮件沟通', description: '更清晰得体的邮件语言' },
  { icon: greetIcon, title: '个人表达', description: '让 AI 输出更贴近你的语气' },
];

export const Landing: FC = () => {
  const navigate = useNavigate();

  const startConverting = () => {
    trackFeature('landing_start_convert');
    navigate('/convert');
  };

  const viewCapabilities = () => {
    trackFeature('landing_view_capabilities');
    document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-eyebrow">
            <span /> 懂你的 AI 写作助手
          </div>
          <h1>
            让 AI 写出的每一句话，
            <strong>更像你</strong>
          </h1>
          <p>
            学习你的语言风格，完成文案改写、整篇文档转换与语料分析。
            保留想表达的意思，也保留属于你的表达方式。
          </p>
          <div className="landing-hero__actions">
            <button type="button" className="landing-primary-button" onClick={startConverting}>
              免费开始转换 <ArrowRightOutlined />
            </button>
            <button type="button" className="landing-secondary-button" onClick={viewCapabilities}>
              查看核心能力
            </button>
          </div>
          <div className="landing-trust-points" aria-label="产品特点">
            <span><CheckCircleFilled /> 文案不用于模型训练</span>
            <span><CheckCircleFilled /> 支持长文档</span>
            <span><CheckCircleFilled /> 内容安全检测</span>
          </div>
        </div>

        <div className="landing-hero__visual" aria-label="语气魔方能力示意">
          <div className="landing-hero__glow" />
          <img src={heroImage} alt="语气魔方层叠方块" />
          <div className="hero-float-card hero-float-card--style">
            <span className="hero-float-card__icon"><BookOutlined /></span>
            <div><small>语料学习</small><strong>理解你的风格</strong></div>
          </div>
          <div className="hero-float-card hero-float-card--document">
            <span className="hero-float-card__icon"><FileTextOutlined /></span>
            <div><small>文档转换</small><strong>长内容也能处理</strong></div>
          </div>
          <div className="hero-result-card">
            <span><SafetyCertificateOutlined /> 保留原意</span>
            <div className="hero-result-card__line hero-result-card__line--long" />
            <div className="hero-result-card__line" />
            <div className="hero-result-card__styles">
              <i>正式</i><i>简洁</i><i>亲切</i>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-capabilities" id="capabilities">
        <div className="landing-section__heading">
          <span>核心能力</span>
          <h2>从一句文案，到整套表达风格</h2>
          <p>不只是换几个词，而是让内容、场景和你的表达习惯更好地结合。</p>
        </div>
        <div className="capability-grid">
          {CAPABILITIES.map((capability, index) => (
            <article className={`capability-card capability-card--${index + 1}`} key={capability.title}>
              <div className="capability-card__icon">{capability.icon}</div>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              <span>{capability.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-workflow">
        <div className="landing-section__heading">
          <span>简单上手</span>
          <h2>四步建立你的表达方式</h2>
        </div>
        <div className="workflow-list">
          {[
            ['01', '提供语料', '上传有代表性的文章或文案'],
            ['02', '分析特点', '提取用词、句式与语言节奏'],
            ['03', '选择场景', '根据内容选择合适表达风格'],
            ['04', '完成转换', '预览、复制或下载转换结果'],
          ].map(([number, title, description]) => (
            <article key={number}>
              <strong>{number}</strong>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-scenes">
        <div className="landing-section__heading">
          <span>使用场景</span>
          <h2>让每一次表达，都恰到好处</h2>
        </div>
        <div className="scene-grid">
          {SCENES.map((scene) => (
            <article key={scene.title}>
              <img src={scene.icon} alt="" />
              <div><h3>{scene.title}</h3><p>{scene.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <span>现在开始</span>
          <h2>准备好让 AI 更像你了吗？</h2>
          <p>从一段文案开始，体验更自然、更贴合场景的表达。</p>
        </div>
        <button type="button" onClick={startConverting}>
          免费体验 <ArrowRightOutlined />
        </button>
      </section>

      <footer className="landing-footer">
        <span>语气魔方 · 让表达更像你</span>
        <button type="button" onClick={() => navigate('/privacy')}>隐私说明</button>
      </footer>
    </main>
  );
};
