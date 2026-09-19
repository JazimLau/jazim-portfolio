import { useLayoutEffect, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import type { ProjectFilterId } from '../data/types'
import { useUI } from '../context/UIContext'
import { WorkFirst } from '../components/sections/WorkFirst'
import { Profile } from '../components/sections/Profile'
import { Timeline } from '../components/sections/Timeline'
import { Projects } from '../components/sections/Projects'
import { Contact } from '../components/sections/Contact'

/**
 * 首页：单页滚动结构，七个区块顺序排列。
 * 跨区块的状态在这里提升：
 *  - projectFilter：Index(ARCHIVE) 能改，Projects 消费
 *  - heroReplay：Contact 的 BACK TO TOP 触发 Hero 标题重播
 */
export function HomePage() {
  const { ready, projectsState } = useUI()
  const location = useLocation()
  const navigationType = useNavigationType()
  /* 从详情页返回时恢复进入前的筛选状态 */
  const [filter, setFilter] = useState<ProjectFilterId | 'all'>(projectsState.filter)

  /* 首页滚动（统一入口，其他页面交给 ScrollManager）：
   * - location.state.scrollTo（如「返回项目库」）：直接定位到目标区块（不先回顶部再滚下来）；
   * - 新进入首页（PUSH / REPLACE，如点「返回首页」logo）：回到顶部；
   * - 返回首页（POP / 浏览器 Back）：用 projectsState.scrollY 恢复离开 Projects 前的
   *   精确滚动位置（进入案例 / 详情页前由 onOpenCase 保存）。
   * 在 layout 阶段（React 提交后、绘制前）执行，先于绘制，避免与旧滚动位置抢滚动。 */
  useLayoutEffect(() => {
    if (!ready) return
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (target) {
      const el = document.getElementById(target)
      if (!el) return
      // 同步直接定位到目标区块（原生 scrollTo 同步生效，无平滑库介入）
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84)
      window.scrollTo({ top, behavior: 'auto' })
      return
    }
    /* 非返回（新进入首页）：回到顶部，不恢复旧位置 */
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    /* 返回：恢复离开前的精确滚动位置 */
    const y = projectsState.scrollY
    if (y == null) return
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    window.scrollTo({ top: Math.min(y, maxY), behavior: 'auto' })
  }, [location.state, ready, projectsState.scrollY, navigationType])

  return (
    <>
      <main>
        <WorkFirst />
        <Projects filter={filter} onFilterChange={setFilter} />
        <Profile />
        <Timeline />
        <Contact onReturnHome={() => window.scrollTo({ top: 0, behavior: 'auto' })} />
      </main>
    </>
  )
}
