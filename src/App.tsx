import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { initGlobalMotionGuards } from './lib/gsap'
import { destroySmoothScroll, initSmoothScroll } from './lib/smoothScroll'
import { navItems } from './data/navigation'
import { useActiveSection } from './hooks/useActiveSection'
import { useUI } from './context/UIContext'
import { Navbar } from './components/layout/Navbar'
import { PageTransition } from './components/layout/PageTransition'
import { ScrollManager } from './components/layout/ScrollManager'
import { LangTransition } from './components/layout/LangTransition'
import { CursorFollower } from './components/ui/CursorFollower'
import { PixelField } from './components/ui/PixelField'
import { HomePage } from './pages/HomePage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { CaseViewerPage } from './pages/CaseViewerPage'
import { NotFoundPage } from './pages/NotFoundPage'

const SECTION_IDS = navItems.map((n) => n.target)

export default function App() {
  const location = useLocation()
  const { ready, setReady, t } = useUI()

  /* 平滑滚动与全局动效守卫只初始化一次 */
  useEffect(() => {
    initSmoothScroll()
    initGlobalMotionGuards()
    return () => destroySmoothScroll()
  }, [])

  /* 非首页没有 Opening，直接置为就绪 */
  useEffect(() => {
    if (location.pathname !== '/') setReady(true)
  }, [location.pathname, setReady])

  const active = useActiveSection(SECTION_IDS, ready && location.pathname === '/')

  return (
    <>
      <a href="#home" className="sr-only">
        {t('跳到主内容', 'Skip to main content')}
      </a>

      <CursorFollower />
      <PixelField />
      <Navbar active={active} />
      <LangTransition />
      <ScrollManager />

      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/projects/:slug/case/:caseId" element={<CaseViewerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition>
    </>
  )
}
