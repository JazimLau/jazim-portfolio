#!/usr/bin/env node
/**
 * verify-production-media.mjs
 * PHASE 51：生产媒体验证器。
 *   读取 COS_MEDIA_UPLOAD_MANIFEST.csv，对全部 .m3u8：
 *     - HTTP 可达性（GET）
 *     - 解析 Manifest 内 .ts 引用，抽样 first / middle / last segment
 *   输出 PRODUCTION_MEDIA_QA.md。
 *   目标：Playlist reachable = 100%，Broken sampled segment = 0。
 *
 * 用法：node scripts/verify-production-media.mjs
 *   在 COS / media.jazimprofile.com 尚未配置时运行，会输出 PENDING（不会误报成功）。
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSV = resolve('COS_MEDIA_UPLOAD_MANIFEST.csv')
const REPORT = resolve('deploy-output/reports/PRODUCTION_MEDIA_QA.md')
const TIMEOUT_MS = 15000
const CONCURRENCY = 6

async function httpGet(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' })
    const buf = Buffer.from(await res.arrayBuffer())
    return { status: res.status, contentType: res.headers.get('content-type') || '', body: buf }
  } catch (e) {
    return { status: 0, contentType: '', body: Buffer.alloc(0), error: String(e) }
  } finally {
    clearTimeout(timer)
  }
}

function parsePlaylist(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker)
  await Promise.all(workers)
  return out
}

if (!existsSync(CSV)) {
  console.error('[verify-production-media] 缺少 COS_MEDIA_UPLOAD_MANIFEST.csv，请先运行 npm run manifest:media')
  process.exit(1)
}

const rows = readFileSync(CSV, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .slice(1)
  .map((l) => l.split(','))

const m3u8Rows = rows.filter((r) => r[2] === '.m3u8')
console.log(`[verify-production-media] 校验 ${m3u8Rows.length} 个 playlist ...`)

// 先探测媒体域名是否可达
const probe = await httpGet('https://media.jazimprofile.com/')
const domainReachable = probe.status > 0
if (!domainReachable) {
  console.warn('[verify-production-media] media.jazimprofile.com 当前不可达（COS/域名尚未配置）→ 输出 PENDING')
}

const results = await mapLimit(m3u8Rows, CONCURRENCY, async (row) => {
  const rel = row[1]
  const url = row[8] // expected_public_url
  const rec = { rel, url, playlistStatus: 0, segments: [], broken: 0, reachable: 0, total: 0 }
  if (!domainReachable) return rec

  const pl = await httpGet(url)
  rec.playlistStatus = pl.status
  if (pl.status !== 200) return rec

  const segNames = parsePlaylist(pl.body.toString('utf8').replace(/^\uFEFF/, ''))
  rec.total = segNames.length
  if (segNames.length === 0) return rec

  const idxs = [0, Math.floor((segNames.length - 1) / 2), segNames.length - 1]
  const unique = [...new Set(idxs)].filter((i) => i >= 0 && i < segNames.length)
  const segBase = url.slice(0, url.lastIndexOf('/') + 1)
  const segs = await mapLimit(unique, CONCURRENCY, async (i) => {
    const segUrl = segBase + encodeURIComponent(segNames[i])
    const r = await httpGet(segUrl)
    return { i, name: segNames[i], status: r.status, ct: r.contentType }
  })
  rec.segments = segs
  rec.reachable = segs.filter((s) => s.status === 200).length
  rec.broken = segs.filter((s) => s.status !== 200).length
  return rec
})

// ── 汇总 ────────────────────────────────────────────────────
const ok = results.filter((r) => r.playlistStatus === 200)
const reachablePct = m3u8Rows.length ? ((ok.length / m3u8Rows.length) * 100).toFixed(1) : '0'
const brokenTotal = results.reduce((s, r) => s + r.broken, 0)

mkdirSync(resolve('deploy-output/reports'), { recursive: true })
const lines = []
lines.push('# PRODUCTION MEDIA QA')
lines.push('')
lines.push(`生成时间：${new Date().toISOString()}`)
lines.push(`媒体域名：https://media.jazimprofile.com`)
lines.push(`Playlist 总数：${m3u8Rows.length}`)
lines.push(`域名可达：${domainReachable ? 'YES' : 'NO（COS/域名尚未配置）'}`)
lines.push('')
if (!domainReachable) {
  lines.push('## 状态：PENDING')
  lines.push('')
  lines.push('COS Bucket / media.jazimprofile.com 尚未配置完成，无法在线验证。')
  lines.push('请在完成 COS 上传、自定义域名与 HTTPS 后，重新运行：')
  lines.push('')
  lines.push('```bash')
  lines.push('npm run verify:media')
  lines.push('```')
} else {
  lines.push('## Playlist 可达性')
  lines.push('')
  lines.push(`- Playlist reachable：${ok.length}/${m3u8Rows.length}（${reachablePct}%）`)
  lines.push(`- Broken sampled segment：${brokenTotal}`)
  lines.push('')
  const fails = results.filter((r) => r.playlistStatus !== 200 || r.broken > 0)
  if (fails.length === 0) {
    lines.push('全部 Playlist 与抽样 Segment 均正常 ✅')
  } else {
    lines.push('| 文件 | Playlist Status | Broken Segments |')
    lines.push('|---|---|---|')
    for (const r of fails) {
      lines.push(`| ${r.rel} | ${r.playlistStatus} | ${r.broken}/${r.reachable + r.broken} |`)
    }
  }
}
writeFileSync(REPORT, lines.join('\n'))

console.log('[verify-production-media] done')
console.log(`  playlists: ${m3u8Rows.length}, reachable: ${ok.length}, broken segments: ${brokenTotal}`)
console.log(`  report   : deploy-output/reports/PRODUCTION_MEDIA_QA.md`)
