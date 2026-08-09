import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { resolveLT, resolveList } from '../data/i18n'
import type { Lang, MaybeLT } from '../data/i18n'
import type { ProjectFilterId } from '../data/types'

export type { Lang } from '../data/i18n'

const LANG_KEY = 'jazim-lang'

interface UIContextValue {
  /** 当前正在渲染的语言 */
  lang: Lang
  /** 用户已点击、但还等着过渡动画走到中点才生效的语言；无切换时为 null */
  pendingLang: Lang | null
  /** 是否处于语言切换过渡中（用于禁用重复点击） */
  switching: boolean
  /** 请求切换到指定语言（触发过渡动画，不立即换文案） */
  requestLang: (next: Lang) => void
  /** 请求切到另一种语言 */
  toggleLang: () => void
  /** 由过渡组件在动画中点调用：真正替换文案 */
  commitLang: () => void
  /** 由过渡组件在动画结束时调用：解锁按钮 */
  finishLangSwitch: () => void

  /** Opening 动画是否已结束（首屏动画的统一开关） */
  ready: boolean
  setReady: (v: boolean) => void

  /** Projects 轮播的现场状态（一级筛选 + 二级筛选 + 当前卡片序号 + 当前视频序号 + 滚动位置）。
   *  进入项目详情页 / 案例页前保存，返回首页时恢复，实现"回到上一状态"。
   *  scrollY 为 null 表示无需要恢复的精确滚动位置（此时走 location.state.scrollTo 区块定位）。 */
  projectsState: {
    filter: ProjectFilterId | 'all'
    subFilter: string
    index: number
    videoIndex: number
    scrollY: number | null
  }
  setProjectsState: (s: {
    filter: ProjectFilterId | 'all'
    subFilter: string
    index: number
    videoIndex: number
    scrollY: number | null
  }) => void

  /** 双语文案取值：t('中文', 'English') */
  t: (cn: string, en: string) => string
  /** 取 data/ 里的 LT 字段：tx(profile.location) */
  tx: (v: MaybeLT) => string
  /** 取 LT 数组：txList(entry.duties) */
  txList: (list: readonly MaybeLT[]) => string[]
}

const UIContext = createContext<UIContextValue | null>(null)

function readStoredLang(): Lang {
  try {
    const v = window.localStorage.getItem(LANG_KEY)
    if (v === 'CN' || v === 'EN') return v
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略 */
  }
  return 'CN'
}

/**
 * 全站 UI 状态。
 * 只放真正跨区块共享的少量状态（语言、声音、首屏就绪），
 * 项目筛选等局部状态留在 HomePage 里提升，不引入额外状态库。
 *
 * 语言切换是两段式的：requestLang 只登记意图，
 * LangTransition 播完前半段遮罩后才 commitLang，
 * 所以文案不会在用户眼前"硬切"。
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readStoredLang)
  const [pendingLang, setPendingLang] = useState<Lang | null>(null)
  const [ready, setReady] = useState(false)
  const [projectsState, setProjectsState] = useState<{
    filter: ProjectFilterId | 'all'
    subFilter: string
    index: number
    videoIndex: number
    scrollY: number | null
  }>({ filter: 'all', subFilter: 'all', index: 0, videoIndex: 0, scrollY: null })

  /* 让浏览器、读屏软件和 CSS 都知道当前语言 */
  useEffect(() => {
    document.documentElement.lang = lang === 'CN' ? 'zh-CN' : 'en'
    document.documentElement.dataset.lang = lang
    try {
      window.localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* 忽略写入失败 */
    }
  }, [lang])

  const requestLang = useCallback((next: Lang) => {
    setPendingLang((cur) => {
      if (cur !== null) return cur // 过渡中忽略新的点击
      return next
    })
  }, [])

  const toggleLang = useCallback(() => {
    setPendingLang((cur) => {
      if (cur !== null) return cur
      return lang === 'CN' ? 'EN' : 'CN'
    })
  }, [lang])

  const commitLang = useCallback(() => {
    if (pendingLang) setLang(pendingLang)
  }, [pendingLang])

  const finishLangSwitch = useCallback(() => {
    setPendingLang(null)
  }, [])

  const t = useCallback((cn: string, en: string) => (lang === 'CN' ? cn : en), [lang])
  const tx = useCallback((v: MaybeLT) => resolveLT(v, lang), [lang])
  const txList = useCallback(
    (list: readonly MaybeLT[]) => resolveList(list, lang),
    [lang]
  )

  const value = useMemo(
    () => ({
      lang,
      pendingLang,
      switching: pendingLang !== null,
      requestLang,
      toggleLang,
      commitLang,
      finishLangSwitch,
      ready,
      setReady,
      projectsState,
      setProjectsState,
      t,
      tx,
      txList,
    }),
    [
      lang,
      pendingLang,
      requestLang,
      toggleLang,
      commitLang,
      finishLangSwitch,
      ready,
      projectsState,
      setProjectsState,
      t,
      tx,
      txList,
    ]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI 必须在 UIProvider 内使用')
  return ctx
}
