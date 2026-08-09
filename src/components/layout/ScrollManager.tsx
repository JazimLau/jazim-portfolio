import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * 统一滚动管理（全站唯一一处"新页面回顶部"逻辑，各页面不再各自写 scrollTo(0,0)）。
 *
 * 规则（按优先级）：
 * 1. 首页（'/'）：滚动一律交给 HomePage —— Opening / 区块定位（scrollTo）/
 *    返回时恢复离开前的精确滚动位置（projectsState.scrollY），这里不干预；
 * 2. 返回 / 前进（POP）：不干预滚动，由浏览器原生恢复 + HomePage 的 scrollY 恢复接管，
 *    保证「返回上一层恢复原滚动位置」；
 * 3. 带 location.state.scrollTo（如「返回项目库」）：交给 HomePage 做区块定位；
 * 4. 其余进入新页面（PUSH / REPLACE，含首次挂载直达子页面）：
 *    在绘制前用 behavior:'auto' 回到顶部，绝不在新页面上继承上一页的滚动位置。
 *
 * 使用 useLayoutEffect（React 提交后、绘制前）执行，先于 PageTransition 的
 * useEffect（绘制后），避免"先回顶部再被浏览器/旧滚动覆盖"的竞态。
 */
export function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const firstRender = useRef(true)

  useLayoutEffect(() => {
    const isFirst = firstRender.current
    firstRender.current = false

    // 首页滚动统一交给 HomePage（Opening / 区块定位 / 返回恢复）
    if (location.pathname === '/') return

    // 返回 / 前进（POP）：交给浏览器原生恢复 + HomePage 的 scrollY 恢复
    if (!isFirst && navigationType === 'POP') return

    // 显式区块定位（navigate('/', {state:{scrollTo:'projects'}})）：交给 HomePage
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (scrollTo) return

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, navigationType, location.state])

  return null
}
