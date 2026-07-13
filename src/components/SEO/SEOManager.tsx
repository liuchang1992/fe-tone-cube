import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';


interface PageSEO {
  title: string;
  description: string;
  indexable: boolean;
}

const DEFAULT_SEO: PageSEO = {
  title: '语气魔方 - AI 文案改写、文档转换与写作风格分析',
  description: '语气魔方是一款懂你表达方式的 AI 写作助手，支持文案语气转换、整篇文档改写和个人写作风格分析。',
  indexable: true,
};

const PAGE_SEO: Record<string, PageSEO> = {
  '/': DEFAULT_SEO,
  '/convert': {
    title: 'AI 文案与文档语气转换 - 语气魔方',
    description: '在线转换文案语气，支持正式、简洁、亲切等表达风格，并可上传 TXT、DOCX、PDF 完成长文档改写。',
    indexable: true,
  },
  '/privacy': {
    title: '隐私政策 - 语气魔方',
    description: '了解语气魔方如何处理账号信息、用户文案、上传文档、语料与产品使用数据。',
    indexable: true,
  },
  '/login': {
    title: '登录 - 语气魔方',
    description: '登录语气魔方，继续使用文案转换、文档转换和个人语料库。',
    indexable: false,
  },
  '/register': {
    title: '注册 - 语气魔方',
    description: '创建语气魔方账号，保存转换历史并建立个人写作风格语料库。',
    indexable: false,
  },
  '/history': {
    title: '转换历史 - 语气魔方',
    description: '查看你的语气转换历史记录。',
    indexable: false,
  },
  '/corpus': {
    title: '个人语料库 - 语气魔方',
    description: '上传代表性文章和文案，分析并建立个人写作风格。',
    indexable: false,
  },
  '/pay': {
    title: '服务升级 - 语气魔方',
    description: '查看语气魔方服务升级选项。',
    indexable: false,
  },
};

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
};

const ensureCanonical = (url: string) => {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
};

const ensureStructuredData = (siteUrl: string) => {
  let script = document.head.querySelector<HTMLScriptElement>('#tone-cube-structured-data');
  if (!script) {
    script = document.createElement('script');
    script.id = 'tone-cube-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '语气魔方',
    url: siteUrl,
    description: DEFAULT_SEO.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'zh-CN',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    featureList: [
      'AI 文案语气转换',
      'TXT、DOCX、PDF 文档转换',
      '个人写作风格与语料分析',
      '转换历史记录',
    ],
  });
};

export const SEOManager = () => {
  const location = useLocation();

  useEffect(() => {
    const seo = PAGE_SEO[location.pathname] ?? {
      title: '页面未找到 - 语气魔方',
      description: DEFAULT_SEO.description,
      indexable: false,
    };
    const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
    const siteUrl = configuredSiteUrl || window.location.origin;
    const canonicalUrl = `${siteUrl}${location.pathname === '/' ? '/' : location.pathname}`;
    const robots = seo.indexable
      ? 'index,follow,max-image-preview:large'
      : 'noindex,nofollow';

    document.title = seo.title;
    ensureMeta('meta[name="description"]', { name: 'description', content: seo.description });
    ensureMeta('meta[name="robots"]', { name: 'robots', content: robots });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    ensureCanonical(canonicalUrl);
    ensureStructuredData(`${siteUrl}/`);
  }, [location.pathname]);

  return null;
};
