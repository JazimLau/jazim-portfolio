#!/usr/bin/env node
/**
 * generate-cos-manifest.mjs
 * PHASE 06 + 07：
 *   1. HLS 完整性审计：解析全部 .m3u8 内部的 .ts 引用，确认每个 Segment 本地存在
 *      （COS 上传保持相同相对结构，禁止扁平化目录）
 *   2. 生成 COS_MEDIA_UPLOAD_MANIFEST.csv（含 sha256）
 *
 * 用法：node scripts/generate-cos-manifest.mjs
 */
import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const VIDEOS_DIR = resolve('public/assets/videos')
const OUT_CSV = resolve('COS_MEDIA_UPLOAD_MANIFEST.csv')
const OUT_REPORT = resolve('deploy-output/reports/HLS_INTEGRITY_AUDIT.md')
// 免备案 COS 默认域名；备案通过后可切回 media.jazimportfolio.com
const MEDIA_BASE = 'https://jazimprofile-media-1465643833.cos.ap-guangzhou.myqcloud.com'

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function sha256(file) {
  const h = createHash('sha256')
  const buf = Buffer.alloc(1024 * 1024)
  const fd = openSync(file)
  let n
  while ((n = readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n))
  closeSync(fd)
  return h.digest('hex')
}

function toPosix(p) {
  return p.split(sep).join('/')
}

// ── 收集全部媒体文件 ────────────────────────────────────────
if (!existsSync(VIDEOS_DIR)) {
  console.error(`[generate-cos-manifest] 未找到 ${VIDEOS_DIR}（本地 HLS 源目录）`)
  process.exit(1)
}
const files = walk(VIDEOS_DIR)
const playlists = files.filter((f) => f.toLowerCase().endsWith('.m3u8'))
const segments = files.filter((f) => f.toLowerCase().endsWith('.ts'))
const others = files.filter(
  (f) => !f.toLowerCase().endsWith('.m3u8') && !f.toLowerCase().endsWith('.ts')
)

// ── HLS 完整性审计 ──────────────────────────────────────────
let brokenRefs = 0
const broken = []
const parentMap = new Map() // ts absolute path -> [playlist rel paths]
for (const pl of playlists) {
  const plDir = pl.slice(0, pl.lastIndexOf(sep) + 1)
  const plRel = toPosix(relative(VIDEOS_DIR, pl))
  const txt = readFileSync(pl, 'utf8')
  const refs = txt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
  for (const ref of refs) {
    // 忽略绝对 URL 引用
    if (/^https?:\/\//i.test(ref)) continue
    const segPath = plDir + ref.split(/[\\/]/).pop()
    if (!existsSync(segPath)) {
      brokenRefs += 1
      broken.push({ pl: plRel, ref })
    } else {
      if (!parentMap.has(segPath)) parentMap.set(segPath, [])
      parentMap.get(segPath).push(plRel)
    }
  }
}

// ── 生成 CSV ────────────────────────────────────────────────
const rows = []
const header = [
  'local_path',
  'relative_path',
  'extension',
  'size',
  'sha256',
  'parent_playlist',
  'playlist_reference',
  'expected_cos_path',
  'expected_public_url',
]
for (const f of files) {
  const rel = toPosix(relative(VIDEOS_DIR, f))
  const ext = f.slice(f.lastIndexOf('.')).toLowerCase()
  const st = statSync(f)
  const parents = parentMap.get(f) || []
  const refName = f.slice(f.lastIndexOf(sep) + 1)
  rows.push(
    [
      toPosix(relative(process.cwd(), f)),
      rel,
      ext,
      st.size,
      ext === '.m3u8' ? '' : sha256(f), // playlist 常变，不参与增量哈希（上传时按相对路径覆盖）
      parents.length ? parents.join('|') : '',
      parents.length ? refName : '',
      `assets/videos/${rel}`,
      `${MEDIA_BASE}/assets/videos/${rel}`,
    ].join(',')
  )
}
writeFileSync(OUT_CSV, [header.join(','), ...rows].join('\n'))

// ── 统计 ────────────────────────────────────────────────────
const totalSize = files.reduce((s, f) => s + statSync(f).size, 0)
console.log('[generate-cos-manifest] OK')
console.log(`  m3u8  : ${playlists.length}`)
console.log(`  ts    : ${segments.length}`)
console.log(`  other : ${others.length}`)
console.log(`  total : ${files.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
console.log(`  broken HLS refs : ${brokenRefs}`)
console.log(`  csv   : ${relative(process.cwd(), OUT_CSV)}`)

// ── 报告 ────────────────────────────────────────────────────
mkdirSync(resolve('deploy-output/reports'), { recursive: true })
const lines = []
lines.push('# HLS INTEGRITY AUDIT')
lines.push('')
lines.push(`生成时间：${new Date().toISOString()}`)
lines.push(`源目录：public/assets/videos/`)
lines.push('')
lines.push('## 统计')
lines.push('')
lines.push(`- .m3u8：${playlists.length}`)
lines.push(`- .ts：${segments.length}`)
lines.push(`- 其它媒体：${others.length}`)
lines.push(`- 文件总数：${files.length}`)
lines.push(`- 总大小：${(totalSize / 1024 / 1024).toFixed(2)} MB`)
lines.push('')
lines.push('## Segment 完整性')
lines.push('')
lines.push(`- BROKEN LOCAL HLS REFERENCES：${brokenRefs}`)
if (broken.length === 0) {
  lines.push('- 结论：每一个 Playlist 引用的 Segment 本地均存在，可原结构上传 COS。')
} else {
  lines.push('')
  lines.push('| Playlist | 缺失 Segment |')
  lines.push('|---|---|')
  for (const { pl, ref } of broken) lines.push(`| ${pl} | ${ref} |`)
  lines.push('')
  lines.push('⚠️ 请先补齐以上缺失 Segment 再上传 COS。')
}
writeFileSync(OUT_REPORT, lines.join('\n'))
console.log(`  report: deploy-output/reports/HLS_INTEGRITY_AUDIT.md`)
