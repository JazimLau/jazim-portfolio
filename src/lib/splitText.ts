/* =========================================================================
   lib/splitText.ts — 轻量文本拆分（自己实现，不引入额外依赖）
   支持逐字与逐行两种模式，中英文混排都可用（CJK 按字，拉丁按词）。
   每个结果都带 revert()，动画结束或组件卸载后还原原始 DOM，
   避免拆分后的固定行结构在窗口缩放时溢出。
   ========================================================================= */

export interface SplitResult {
  /** 可参与动画的元素（逐字模式为每个字，逐行模式为每行） */
  targets: HTMLElement[]
  revert: () => void
}

/** CJK 及全角标点范围：这些字符按单字断行 */
const CJK = /[⺀-鿿　-〿＀-￯]/

/** 把纯文本切成"排版单元"：CJK 单字、拉丁单词、标点各算一个，空格单独保留 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  let buffer = ''

  const flush = () => {
    if (buffer) {
      tokens.push(buffer)
      buffer = ''
    }
  }

  for (const ch of Array.from(text)) {
    if (/\s/.test(ch)) {
      flush()
      tokens.push(' ')
    } else if (CJK.test(ch)) {
      flush()
      tokens.push(ch)
    } else {
      buffer += ch
    }
  }
  flush()
  return tokens
}

/**
 * 逐字拆分。mask 为 true 时每个字外层套一个 overflow:hidden 容器，
 * 可以做"从下方滑入"而不溢出。
 */
export function splitChars(el: HTMLElement, mask = true): SplitResult {
  const original = el.innerHTML
  const text = el.textContent ?? ''
  const targets: HTMLElement[] = []

  el.textContent = ''

  for (const ch of Array.from(text)) {
    if (/\s/.test(ch)) {
      el.appendChild(document.createTextNode(' '))
      continue
    }
    const inner = document.createElement('span')
    inner.className = 'split-char'
    inner.textContent = ch
    inner.setAttribute('aria-hidden', 'false')

    if (mask) {
      const outer = document.createElement('span')
      outer.className = 'split-mask'
      outer.appendChild(inner)
      el.appendChild(outer)
    } else {
      el.appendChild(inner)
    }
    targets.push(inner)
  }

  return {
    targets,
    revert: () => {
      el.innerHTML = original
    },
  }
}

/**
 * 逐行拆分：先按排版单元铺开、量出每个单元的 offsetTop，再按行重组。
 * 结果是若干 .split-mask-line > span，可整行做遮罩揭示。
 */
export function splitLines(el: HTMLElement): SplitResult {
  const original = el.innerHTML
  const text = el.textContent ?? ''
  const tokens = tokenize(text)

  // 第一步：铺开成可测量的单元
  el.textContent = ''
  const probes: HTMLElement[] = []
  for (const token of tokens) {
    if (token === ' ') {
      const space = document.createElement('span')
      space.className = 'split-probe split-probe-space'
      space.innerHTML = '&nbsp;'
      el.appendChild(space)
      probes.push(space)
      continue
    }
    const span = document.createElement('span')
    span.className = 'split-probe'
    span.textContent = token
    el.appendChild(span)
    probes.push(span)
  }

  // 第二步：按 offsetTop 归组成行
  const lines: string[] = []
  let currentTop: number | null = null
  let currentText = ''

  for (const probe of probes) {
    const top = probe.offsetTop
    if (currentTop === null) currentTop = top
    // 允许 2px 抖动，避免因基线差异误判换行
    if (Math.abs(top - currentTop) > 2) {
      lines.push(currentText.trim())
      currentText = ''
      currentTop = top
    }
    currentText += probe.classList.contains('split-probe-space') ? ' ' : probe.textContent
  }
  if (currentText.trim()) lines.push(currentText.trim())

  // 第三步：重组为带遮罩的行
  el.textContent = ''
  const targets: HTMLElement[] = []
  for (const line of lines.length ? lines : [text]) {
    const wrap = document.createElement('span')
    wrap.className = 'split-mask-line'
    const inner = document.createElement('span')
    inner.textContent = line
    wrap.appendChild(inner)
    el.appendChild(wrap)
    targets.push(inner)
  }

  return {
    targets,
    revert: () => {
      el.innerHTML = original
    },
  }
}
