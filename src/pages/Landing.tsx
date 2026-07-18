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
    title: '决定内容怎么改',
    description: '先选择邮件、汇报、社交媒体等使用场景，再决定仅润色、常规改写或结构重组。',
    meta: '场景与改写方式分开控制',
  },
  {
    icon: <BookOutlined />,
    title: '建立可复用的个人风格',
    description: '从本人素材生成，也可以手动配置用词、语气和表达规则；支持多套风格、版本恢复与硬约束校验。',
    meta: '需要时叠加，不用时随时关闭',
  },
  {
    icon: <FileTextOutlined />,
    title: '整篇文档也能转换',
    description: '上传 TXT、DOCX 或 PDF，沿用相同的场景、改写方式和个人风格，完成后直接预览和下载。',
    meta: '最多 15000 字符',
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
            先选择使用场景和改写方式，再按需叠加你的个人风格。
            从一句文案到整篇文档，保留原意，也保留属于你的表达习惯。
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
            <span><CheckCircleFilled /> 支持文本与长文档</span>
            <span><CheckCircleFilled /> 个人约束强制校验</span>
          </div>
        </div>

        <div className="landing-hero__visual" aria-label="语气魔方能力示意">
          <div className="landing-hero__glow" />
          <img src={heroImage} alt="语气魔方层叠方块" />
          <div className="hero-float-card hero-float-card--style">
            <span className="hero-float-card__icon"><BookOutlined /></span>
            <div><small>个人风格</small><strong>规则与版本可控</strong></div>
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
              <i>邮件场景</i><i>常规改写</i><i>个人风格</i>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-capabilities" id="capabilities">
        <div className="landing-section__heading">
          <span>核心能力</span>
          <h2>改多少、怎么表达，都由你决定</h2>
          <p>改写方式控制允许怎样调整原文，个人风格控制最终的用词、语气和表达规则。</p>
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
            ['01', '输入内容', '粘贴一段文字，或上传整篇文档'],
            ['02', '选择怎么改', '选择使用场景与改写方式'],
            ['03', '按需叠加风格', '使用个人风格，或保持普通表达'],
            ['04', '检查与采用', '查看结果、效果对比和历史记录'],
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
          <p>无需提前配置，从一段文案开始；登录后还可以逐步建立自己的表达风格。</p>
        </div>
        <button type="button" onClick={startConverting}>
          免费体验 <ArrowRightOutlined />
        </button>
      </section>

      <footer className="landing-footer">
        <span>语气魔方 · 让表达更像你</span>
        <div className="landing-footer__links">
          <button type="button" onClick={() => navigate('/privacy')}>隐私说明</button>
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
          >
            京ICP备2026042578号-1
          </a>
        </div>
      </footer>
    </main>
  );
};
