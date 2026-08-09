import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 本地双击即开修复：file:// 协议下页面 origin 是 null，
 * 而 Vite 构建产物默认给 script/link 加 crossorigin 属性，
 * 会触发 CORS 检查导致模块被浏览器拦截（页面白屏）。
 * 产物只引用相对路径同源资源，移除 crossorigin 完全无副作用。
 */
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin-for-file',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin/gi, '')
    },
  }
}

/**
 * 多部署目标统一构建（同一份源码，仅 Build Target / Vite Base / Production 配置不同）：
 *
 *   npm run build           -> vite build（mode=production）加载 .env.production
 *   npm run build:deploy    -> vite build --mode tencent 加载 .env.tencent
 *   npm run build:github    -> vite build --mode github  加载 .env.github
 *
 * base 由各 env 文件里的 VITE_BASE 提供：
 *   - 默认 ./                本地 dist 双击 file:// 打开
 *   - .env.tencent VITE_BASE=/                Tencent EdgeOne 根目录
 *   - .env.github  VITE_BASE=/jazim-portfolio/ GitHub Pages 仓库子路径
 *   （若未来 Repo 是 USERNAME.github.io 用户站，把 .env.github 的 VITE_BASE 改为 /）
 *
 * 媒体域名 VITE_MEDIA_BASE_URL 同样在对应 env 中配置（见 src/lib/media.ts）。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || './'

  return {
    plugins: [react(), stripCrossorigin()],
    /* base 由部署目标 env 决定；默认相对路径产物可 file:// 双击打开 */
    base,
    server: {
      /* 固定本地访问地址：端口冲突时报错而不是随机换端口，便于 start-dev.bat 一键启动 */
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      open: true,
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // 把动画与路由库拆出主包，首屏 JS 更小
            gsap: ['gsap'],
            router: ['react-router-dom'],
          },
        },
      },
    },
  }
})
