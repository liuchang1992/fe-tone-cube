import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
// import { visualizer } from 'rollup-plugin-visualizer';


const createSeoFilesPlugin = (siteUrl: string): Plugin => ({
  name: 'tone-cube-seo-files',
  generateBundle() {
    const privatePaths = ['/history', '/corpus', '/pay', '/login', '/register'];
    const robotsLines = [
      'User-agent: *',
      'Allow: /',
      ...privatePaths.map((route) => `Disallow: ${route}`),
    ];
    if (siteUrl) robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `${robotsLines.join('\n')}\n`,
    });

    if (!siteUrl) return;
    const lastModified = new Date().toISOString().slice(0, 10);
    const pages = [
      { path: '/', priority: '1.0', frequency: 'weekly' },
      { path: '/convert', priority: '0.9', frequency: 'weekly' },
      { path: '/privacy', priority: '0.3', frequency: 'yearly' },
    ];
    const urls = pages.map((page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${page.frequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = env.VITE_SITE_URL?.replace(/\/$/, '') || '';

  return {
    plugins: [
      react(),
      createSeoFilesPlugin(siteUrl),
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   filename: 'dist/stats.html',
      // })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('antd')) return 'antd';
              if (id.includes('@ant-design/icons')) return 'antd-icons';
              if (id.includes('react-router') || id.includes('history')) return 'router';
              if (id.includes('axios')) return 'axios';
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
