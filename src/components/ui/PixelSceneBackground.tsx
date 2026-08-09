import type { CSSProperties } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './PixelSceneBackground.module.css'

/**
 * PixelSceneBackground —— 每个区块独立的"大尺度像素构图"背景层。
 * 组合：大型阶梯块 + 大型系统编号 + 断续轨道（像素光块脉冲）+ Dithering 点阵区。
 * 不同 variant 使用不同构图，杜绝全站共用同一张规则网格。
 * 置于区块内容之下（z-index 0），pointer-events: none。
 */

export type SceneVariant =
  | 'hero'
  | 'index'
  | 'profile'
  | 'timeline'
  | 'skills'
  | 'projects'
  | 'projectDetail'
  | 'contact'

interface Block {
  x: number
  y: number
  w: number
  h: number
  c: string
  delay?: number
}
interface Glyph {
  x: number
  y: number
  text: string
  size: number
  c?: string
}
interface Track {
  x: number
  y: number
  w: number
  h: number
}
interface Dither {
  x: number
  y: number
  w: number
  h: number
  dense?: boolean
}

interface SceneConfig {
  blocks: Block[]
  glyphs: Glyph[]
  tracks: Track[]
  dithers: Dither[]
}

const SCENES: Record<SceneVariant, SceneConfig> = {
  hero: {
    blocks: [
      { x: 2, y: 12, w: 36, h: 60, c: 'rgba(13,20,16,0.5)', delay: 0 },
      { x: 66, y: 6, w: 30, h: 44, c: 'rgba(15,24,28,0.42)', delay: 1 },
      { x: 42, y: 82, w: 22, h: 10, c: 'rgba(18,26,20,0.4)', delay: 2 },
    ],
    glyphs: [
      { x: 3, y: 4, text: 'PLAYER', size: 132, c: 'rgba(255,255,255,0.045)' },
      { x: 70, y: 58, text: 'MOTION', size: 84, c: 'rgba(117,87,255,0.05)' },
    ],
    tracks: [
      /* 连接左右区域的中段信号带（下移避免与标题拥挤）+ 纵向通道 + 底部轨道 */
      { x: 34, y: 62, w: 34, h: 3 },
      { x: 37, y: 70, w: 3, h: 26 },
      { x: 2, y: 94, w: 58, h: 2 },
    ],
    dithers: [
      { x: 36, y: 8, w: 4, h: 72, dense: true },
      { x: 58, y: 48, w: 40, h: 7 },
      { x: 40, y: 66, w: 16, h: 14, dense: true },
    ],
  },
  index: {
    blocks: [
      { x: 0, y: 0, w: 26, h: 46, c: 'rgba(16,22,30,0.45)', delay: 0 },
      { x: 66, y: 40, w: 34, h: 40, c: 'rgba(20,26,22,0.4)', delay: 1 },
      { x: 30, y: 70, w: 18, h: 22, c: 'rgba(13,19,15,0.5)', delay: 2 },
    ],
    glyphs: [
      { x: 3, y: 8, text: 'INDEX', size: 110, c: 'rgba(255,255,255,0.05)' },
    ],
    tracks: [
      { x: 24, y: 52, w: 4, h: 42 },
      { x: 58, y: 78, w: 40, h: 3 },
    ],
    dithers: [
      { x: 24, y: 4, w: 4, h: 46, dense: true },
      { x: 40, y: 88, w: 30, h: 6 },
    ],
  },
  profile: {
    /* 移除右上角空白背景块（PLAYER DATA 面板上方显空洞） */
    blocks: [
      { x: 0, y: 16, w: 30, h: 52, c: 'rgba(15,21,26,0.45)', delay: 0 },
    ],
    glyphs: [
      { x: 4, y: 6, text: 'PLAYER', size: 110, c: 'rgba(255,255,255,0.045)' },
      { x: 70, y: 56, text: 'FILE', size: 120, c: 'rgba(117,87,255,0.05)' },
    ],
    tracks: [
      { x: 30, y: 30, w: 3, h: 60 },
      { x: 60, y: 90, w: 40, h: 2 },
    ],
    dithers: [
      { x: 28, y: 12, w: 5, h: 60, dense: true },
      { x: 60, y: 40, w: 38, h: 8 },
    ],
  },
  timeline: {
    blocks: [
      { x: 6, y: 6, w: 12, h: 88, c: 'rgba(14,22,18,0.45)', delay: 0 },
      { x: 70, y: 30, w: 30, h: 40, c: 'rgba(16,22,28,0.4)', delay: 1 },
    ],
    glyphs: [
      { x: 2, y: 2, text: 'MISSION', size: 90, c: 'rgba(255,255,255,0.05)' },
    ],
    tracks: [
      { x: 10, y: 10, w: 2, h: 86 },
      { x: 40, y: 60, w: 24, h: 2 },
    ],
    dithers: [
      { x: 12, y: 8, w: 4, h: 80, dense: true },
      { x: 70, y: 34, w: 28, h: 6 },
    ],
  },
  skills: {
    blocks: [
      { x: 4, y: 20, w: 26, h: 50, c: 'rgba(17,15,26,0.45)', delay: 0 },
      { x: 60, y: 10, w: 38, h: 60, c: 'rgba(16,24,20,0.4)', delay: 1 },
    ],
    glyphs: [
      { x: 4, y: 6, text: 'SKILLS', size: 96, c: 'rgba(255,255,255,0.05)' },
      { x: 60, y: 72, text: 'NODE', size: 100, c: 'rgba(184,255,61,0.04)' },
    ],
    tracks: [
      { x: 30, y: 34, w: 30, h: 3 },
      { x: 40, y: 70, w: 3, h: 24 },
    ],
    dithers: [
      { x: 26, y: 20, w: 5, h: 50, dense: true },
      { x: 60, y: 44, w: 36, h: 8 },
    ],
  },
  projects: {
    blocks: [
      { x: 30, y: 12, w: 40, h: 56, c: 'rgba(14,22,20,0.45)', delay: 0 },
      { x: 0, y: 70, w: 20, h: 24, c: 'rgba(18,20,26,0.4)', delay: 1 },
    ],
    /* 背景英文与项目卡 MISSION 编号重复，删除 */
    glyphs: [],
    tracks: [
      { x: 26, y: 50, w: 48, h: 3 },
      { x: 40, y: 66, w: 20, h: 2 },
    ],
    dithers: [
      { x: 32, y: 16, w: 6, h: 56, dense: true },
      { x: 10, y: 82, w: 26, h: 5 },
    ],
  },
  projectDetail: {
    blocks: [
      { x: 0, y: 8, w: 26, h: 60, c: 'rgba(16,24,22,0.4)', delay: 0 },
      { x: 56, y: 30, w: 40, h: 42, c: 'rgba(13,20,26,0.42)', delay: 1 },
    ],
    glyphs: [
      { x: 2, y: 2, text: 'CASE', size: 120, c: 'rgba(255,255,255,0.05)' },
      { x: 64, y: 76, text: 'REEL', size: 90, c: 'rgba(91,200,255,0.04)' },
    ],
    tracks: [
      { x: 26, y: 40, w: 3, h: 40 },
      { x: 30, y: 82, w: 50, h: 2 },
    ],
    dithers: [
      { x: 26, y: 10, w: 4, h: 60, dense: true },
      { x: 56, y: 34, w: 40, h: 6 },
    ],
  },
  contact: {
    blocks: [
      { x: 0, y: 20, w: 30, h: 60, c: 'rgba(16,22,26,0.42)', delay: 0 },
      { x: 68, y: 0, w: 30, h: 48, c: 'rgba(14,20,16,0.4)', delay: 1 },
    ],
    /* 背景英文与 Contact 大标题重复，删除 */
    glyphs: [],
    tracks: [
      { x: 30, y: 30, w: 26, h: 2 },
      { x: 60, y: 50, w: 30, h: 2 },
    ],
    dithers: [
      { x: 28, y: 24, w: 6, h: 40, dense: true },
      { x: 60, y: 60, w: 34, h: 8 },
    ],
  },
}

export function PixelSceneBackground({ variant }: { variant: SceneVariant }) {
  const reduced = useReducedMotion()
  const scene = SCENES[variant]

  return (
    <div className={styles.scene} data-variant={variant} aria-hidden="true">
      {scene.blocks.map((b, i) => (
        <span
          key={`b${i}`}
          className={`${styles.block} ${reduced ? '' : styles.blockIdle}`}
          style={
            {
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.w}%`,
              height: `${b.h}%`,
              background: b.c,
              '--bd': `${b.delay ?? i * 2}s`,
            } as CSSProperties
          }
        />
      ))}

      {scene.glyphs.map((g, i) => (
        <span
          key={`g${i}`}
          className={styles.glyph}
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            fontSize: `clamp(${Math.round(g.size * 0.5)}px, ${g.size / 14}vw, ${g.size}px)`,
            color: g.c ?? 'rgba(255,255,255,0.05)',
          }}
        >
          {g.text}
        </span>
      ))}

      {scene.tracks.map((t, i) => (
        <span
          key={`t${i}`}
          className={styles.track}
          style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}px` }}
        >
          <i className={styles.trackPulse} />
        </span>
      ))}

      {scene.dithers.map((d, i) => (
        <span
          key={`d${i}`}
          className={`${styles.dither} ${d.dense ? styles.ditherDense : ''}`}
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, height: `${d.h}%` }}
        />
      ))}
    </div>
  )
}
