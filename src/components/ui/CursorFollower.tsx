import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useIsCompact, useIsTouch, useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './CursorFollower.module.css'

/**
 * 光标状态：完全由语义属性驱动（data-cursor），不读取 innerText。
 * - data-cursor="select"    Nav 等菜单选择 → SELECT
 * - data-cursor="open"      Project / Case → OPEN
 * - data-cursor="video"     视频本体 → PLAY / PAUSE（随 data-cursor-state 切换）
 * - data-cursor="disabled"  不可操作元素 → 变暗 + —
 * - data-cursor="text"      强制文本态 → 系统 text 光标
 * - data-cursor="label"     + data-cursor-label → 自定义文字（VIEW / NEXT / PREV…）
 * - data-cursor="link"      通用可点击（按钮 / 图标按钮等）→ 展开，不显示文字
 * 另外自动识别 a / button / [role="button"] 等原生可点击元素。
 *
 * 视觉：HUD Reticle —— 四角断角 bracket + 中心像素点。
 * 左键收缩 + Accent Flash；右键紫色 + R；双击 ×2 + 双扫描；文本态恢复系统光标。
 * 触摸 / 窄屏完全关闭；prefers-reduced-motion 保留但瞬时切换。
 */
type CursorState =
  | 'default'
  | 'interactive'
  | 'select'
  | 'open'
  | 'video'
  | 'disabled'
  | 'text'
  | 'label'

export function CursorFollower() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CursorState>('default')
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)

  const reduced = useReducedMotion()
  const isTouch = useIsTouch()
  const isCompact = useIsCompact()
  /* 触摸 / 窄屏完全关闭；reduced-motion 保留（仅瞬时切换） */
  const enabled = !isTouch && !isCompact

  const stateRef = useRef(state)
  stateRef.current = state

  /* 启用/停用时同步 body 标记，驱动全局 cursor 显隐 */
  useEffect(() => {
    document.body.dataset.customCursor = enabled ? 'on' : 'off'
    if (!enabled) document.body.dataset.cursorText = 'off'
    return () => {
      document.body.dataset.customCursor = 'off'
      document.body.dataset.cursorText = 'off'
    }
  }, [enabled])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !enabled) return

    /* 极轻微 delayed follow；reduced-motion 下瞬时跟随 */
    const dur = reduced ? 0 : 0.1
    const xTo = gsap.quickTo(root, 'x', { duration: dur, ease: 'power3.out' })
    const yTo = gsap.quickTo(root, 'y', { duration: dur, ease: 'power3.out' })

    let textMode = false
    const setTextMode = (on: boolean) => {
      if (textMode === on) return
      textMode = on
      document.body.dataset.cursorText = on ? 'on' : 'off'
      root.classList.toggle(styles.textMode, on)
    }

    /* 根据当前悬停目标解析状态（复用，避免 onOver / 恢复标签重复逻辑） */
    const resolve = (target: EventTarget | null): { state: CursorState; label: string } => {
      const el = target as HTMLElement | null
      const host = el?.closest?.('[data-cursor]') as HTMLElement | null
      if (host) {
        const val = host.dataset.cursor ?? ''
        switch (val) {
          case 'text':
            return { state: 'text', label: '' }
          case 'select':
            return { state: 'select', label: 'SELECT' }
          case 'open':
            return { state: 'open', label: 'OPEN' }
          case 'video': {
            const playing = host.dataset.cursorState === 'playing'
            return { state: 'video', label: playing ? 'PAUSE' : 'PLAY' }
          }
          case 'disabled':
            return { state: 'disabled', label: '—' }
          case 'label':
            return { state: 'label', label: host.dataset.cursorLabel || '' }
          default:
            /* link 等旧语义：通用可点击 */
            return { state: 'interactive', label: '' }
        }
      }
      if (
        el?.closest?.(
          'a, button, [role="button"], [role="tab"], [role="slider"], [role="option"], [role="menuitem"], [aria-pressed]'
        )
      ) {
        return { state: 'interactive', label: '' }
      }
      if (
        el?.closest?.(
          'input, textarea, select, [contenteditable="true"], p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption'
        )
      ) {
        return { state: 'text', label: '' }
      }
      return { state: 'default', label: '' }
    }

    const apply = (next: { state: CursorState; label: string }) => {
      setState(next.state)
      setLabel(next.label)
      setTextMode(next.state === 'text')
      /* 状态类：驱动 bracket 展开 / 文字显隐 / 变暗 */
      root.classList.toggle(styles.isInteractive, next.state === 'interactive')
      root.classList.toggle(styles.isSelect, next.state === 'select')
      root.classList.toggle(styles.isOpen, next.state === 'open')
      root.classList.toggle(styles.isVideo, next.state === 'video')
      root.classList.toggle(styles.isDisabled, next.state === 'disabled')
      root.classList.toggle(styles.isLabel, next.state === 'label')
      root.classList.toggle(styles.isText, next.state === 'text')
    }

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      if (!visible) setVisible(true)
      /* video 状态：播放/暂停切换时实时同步 PLAY / PAUSE */
      if (stateRef.current === 'video') {
        const host = (e.target as HTMLElement | null)?.closest?.('[data-cursor="video"]') as
          | HTMLElement
          | null
        const playing = host?.dataset.cursorState === 'playing'
        setLabel(playing ? 'PAUSE' : 'PLAY')
      }
    }

    const onOver = (e: PointerEvent) => {
      apply(resolve(e.target) ?? { state: 'default', label: '' })
    }

    /* 按下：PRESS 状态在松开 / 取消 / 失焦前持续保持（不做 setTimeout 自动恢复），
       按下瞬间的 bracket 收缩动画由 CSS transition 一次性完成，状态则持续到释放。 */
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      root.classList.add(styles.pressed)
    }
    const releasePress = () => root.classList.remove(styles.pressed)
    const onUp = () => releasePress()
    const onCancel = () => releasePress()
    const onBlur = () => releasePress()

    /* 右键：仅视觉反馈（紫色 + R），绝不 preventDefault，原生菜单保留 */
    let rightTimer: number | undefined
    const onContext = () => {
      root.classList.add(styles.right)
      setLabel('R')
      if (rightTimer) clearTimeout(rightTimer)
      rightTimer = window.setTimeout(() => {
        root.classList.remove(styles.right)
        apply(resolve(document.elementFromPoint(0, 0)) ?? { state: 'default', label: '' })
      }, reduced ? 0 : 200)
    }

    /* 双击：×2 + 双扫描，纯视觉 */
    let dblTimer: number | undefined
    const onDbl = () => {
      root.classList.add(styles.dbl)
      setLabel('×2')
      if (dblTimer) clearTimeout(dblTimer)
      dblTimer = window.setTimeout(() => {
        root.classList.remove(styles.dbl)
        apply(resolve(document.elementFromPoint(0, 0)) ?? { state: 'default', label: '' })
      }, reduced ? 0 : 320)
    }

    const onLeaveWindow = () => {
      setVisible(false)
      setTextMode(false)
    }
    const onEnterWindow = () => setVisible(true)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onCancel, { passive: true })
    window.addEventListener('blur', onBlur)
    window.addEventListener('contextmenu', onContext)
    window.addEventListener('dblclick', onDbl)
    document.addEventListener('mouseleave', onLeaveWindow)
    document.addEventListener('mouseenter', onEnterWindow)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('contextmenu', onContext)
      window.removeEventListener('dblclick', onDbl)
      document.removeEventListener('mouseleave', onLeaveWindow)
      document.removeEventListener('mouseenter', onEnterWindow)
      if (rightTimer) clearTimeout(rightTimer)
      if (dblTimer) clearTimeout(dblTimer)
    }
  }, [enabled, reduced, visible])

  if (!enabled) return null

  const showLabel =
    state === 'select' || state === 'open' || state === 'video' || state === 'disabled' || state === 'label'

  return (
    <div
      ref={rootRef}
      className={[
        styles.root,
        visible ? styles.visible : '',
        showLabel || label ? styles.hasLabel : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span className={styles.bracket} aria-hidden="true">
        <i className={styles.corner} data-c="tl" />
        <i className={styles.corner} data-c="tr" />
        <i className={styles.corner} data-c="bl" />
        <i className={styles.corner} data-c="br" />
      </span>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.scanline} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
