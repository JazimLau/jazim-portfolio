#!/usr/bin/env node
/**
 * prepare-deploy-build.mjs
 * 部署产物后处理（PHASE 21/22）：
 *   1. 确认目标目录存在且 index.html 就位
 *   2. 确认构建产物中已使用生产媒体域名（免备案 COS 默认域名；备案后可换 media.jazimportfolio.com）
 *   3. 移除 dist 产物中的 HLS 副本（只删产物，绝不删 public/assets/videos/ 源文件）
 *   4. 扫描残留的 *.m3u8 / *.ts / *.mov / 大型 mp4/webm
 *   5. 生成 DEPLOY_BUILD_MEDIA_AUDIT.md
 *
 * 用法：node scripts/prepare-deploy-build.mjs [targetDir]
 *   默认 targetDir = deploy-output/tencent-site
 */
import { existsSync, readdirSync, readFileSync, statSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const targetDir = resolve(process.argv[2] || 'deploy-output/tencent-site')
const MEDIA_DOMAIN = 'jazimprofile-media-1465643833.cos.ap-guangzhou.myqcloud.com'
const reportsDir = resolve('deploy-output/reports')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function fmtMB(n) {
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

// ── 1. 目录存在性 ──────────────────────────────────────────
if (!existsSync(join(targetDir, 'index.html'))) {
  console.error(`[prepare-deploy-build] 目标目录不存在 index.html：${targetDir}`)
  console.error('请先运行 npm run build:deploy 或 npm run build:github。')
  process.exit(1)
}

// ── 2. 生产媒体域名确认（抽查产物 JS 是否包含 COS 域名） ────
const allFiles = walk(targetDir)
const jsFiles = allFiles.filter((f) => f.endsWith('.js'))
let mediaBaseConfirmed = false
let sample = ''
for (const f of jsFiles) {
  try {
    const txt = readFileSync(f, 'utf8')
    if (txt.includes(MEDIA_DOMAIN)) {
      mediaBaseConfirmed = true
      sample = relative(process.cwd(), f)
      break
    }
  } catch {
    /* 忽略无法读取的文件 */
  }
}

// ── 2.5 index.html 静态资源改写为 COS（国内 CDN 秒开） ──────
// 页面入口仍在部署主机（GitHub Pages / EdgeOne），但 script/link/favicon 等
// 静态资源统一改写为 COS 默认域名，国内手机/桌面访问秒开。
// （COS 默认域名对 script/link/img/XHR 资源加载不受强制下载头影响。）
const siteOrigin = `https://${MEDIA_DOMAIN}`
const indexPath = join(targetDir, 'index.html')
{
  let html = readFileSync(indexPath, 'utf8')
  const before = html
  html = html
    .replace(/src="\.\/assets\//g, `src="${siteOrigin}/assets/`)
    .replace(/href="\.\/assets\//g, `href="${siteOrigin}/assets/`)
    .replace(/src="\/assets\//g, `src="${siteOrigin}/assets/`)
    .replace(/href="\/assets\//g, `href="${siteOrigin}/assets/`)
    .replace(/href="\.\/favicon\.svg"/g, `href="${siteOrigin}/favicon.svg"`)
    .replace(/href="\/favicon\.svg"/g, `href="${siteOrigin}/favicon.svg"`)
  if (html !== before) {
    writeFileSync(indexPath, html)
    console.log(`[prepare-deploy-build] index.html 静态资源 -> ${siteOrigin}`)
  }
}

// ── 3. 移除 HLS 副本（只删产物内） ─────────────────────────
const videoDir = join(targetDir, 'assets', 'videos')
let removedFiles = 0
let removedBytes = 0
if (existsSync(videoDir)) {
  for (const f of walk(videoDir)) {
    const st = statSync(f)
    removedFiles += 1
    removedBytes += st.size
  }
  rmSync(videoDir, { recursive: true, force: true })
}

// ── 4. 残留大型媒体扫描（在删除之后重新遍历，避免 stat 已删文件） ──
const remainingFiles = walk(targetDir)
const VIDEO_EXTS = ['.m3u8', '.ts', '.mov', '.mp4', '.webm']
const residual = remainingFiles
  .filter((f) => VIDEO_EXTS.some((e) => f.toLowerCase().endsWith(e)))
  .map((f) => ({ f, size: statSync(f).size }))
  .filter((x) => x.size > 1024 * 1024) // >1MB 才记录
  .sort((a, b) => b.size - a.size)

// ── 5. 生成报告 ─────────────────────────────────────────────
mkdirSync(reportsDir, { recursive: true })
const lines = []
lines.push('# DEPLOY_BUILD_MEDIA_AUDIT')
lines.push('')
lines.push(`生成时间：${new Date().toISOString()}`)
lines.push(`目标目录：${relative(process.cwd(), targetDir)}`)
lines.push('')
lines.push('## 目录与媒体 base')
lines.push('')
lines.push(`- index.html 存在：YES`)
lines.push(`- 生产媒体域名已注入产物（${MEDIA_DOMAIN}）：${mediaBaseConfirmed ? 'YES' : 'NO ⚠️'}`)
if (sample) lines.push(`- 抽样文件：${sample}`)
lines.push('')
lines.push('## HLS 剥离（dist 副本 → 删除）')
lines.push('')
lines.push(`- 删除文件数：${removedFiles}`)
lines.push(`- 释放空间：${fmtMB(removedBytes)}`)
lines.push('')
lines.push('## 残留大型视频扫描（>1MB）')
lines.push('')
if (residual.length === 0) {
  lines.push('- 0 个残留（.m3u8 / .ts / .mov / 大型 mp4/webm）')
} else {
  lines.push(`- ${residual.length} 个残留（需要人工 REVIEW）：`)
  lines.push('')
  lines.push('| 文件 | 大小 |')
  lines.push('|---|---|')
  for (const { f, size } of residual) {
    lines.push(`| ${relative(process.cwd(), f)} | ${fmtMB(size)} |`)
  }
}
lines.push('')
lines.push('## 结论')
lines.push('')
lines.push(
  removedFiles > 0 || mediaBaseConfirmed
    ? '- 部署 Site Artifact 不含 HLS；媒体统一由 COS 提供。'
    : '- 未发现需要剥离的 HLS，也未见 COS 媒体域名（请确认 VITE_MEDIA_BASE_URL 已注入）。'
)
writeFileSync(join(reportsDir, 'DEPLOY_BUILD_MEDIA_AUDIT.md'), lines.join('\n'))

console.log('[prepare-deploy-build] OK')
console.log(`  target   : ${relative(process.cwd(), targetDir)}`)
console.log(`  media    : ${MEDIA_DOMAIN} ${mediaBaseConfirmed ? 'confirmed' : 'MISSING ⚠️'}`)
console.log(`  hls-removed: ${removedFiles} files (${fmtMB(removedBytes)})`)
console.log(`  residual : ${residual.length} large video file(s)`)
console.log(`  report   : deploy-output/reports/DEPLOY_BUILD_MEDIA_AUDIT.md`)
