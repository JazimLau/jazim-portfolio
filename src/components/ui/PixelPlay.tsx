import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './PixelPlay.css'

/** Decorative feedback only: never captures input or delays navigation. */
export function PixelPlay() {
  const layer = useRef<HTMLDivElement>(null)
  const hold = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('pixel-title-enter')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.3 })
    document.querySelectorAll('h1, section h2').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [location.pathname, reduced])

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let startX = 0, startY = 0
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const stop = () => { if (hold.current) hold.current.dataset.down = 'false' }
    const burst = (x: number, y: number) => {
      const el = document.createElement('span')
      el.className = 'pixel-click'
      el.style.left = `${x}px`; el.style.top = `${y}px`
      layer.current?.appendChild(el)
      const timer = setTimeout(() => { el.remove(); timers.delete(timer) }, 450)
      timers.add(timer)
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType !== 'mouse') return
      if ((event.target as Element).closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return
      startX = event.clientX; startY = event.clientY
      burst(startX, startY)
      if (hold.current) {
        hold.current.style.left = `${startX}px`; hold.current.style.top = `${startY}px`
        hold.current.dataset.down = 'true'
      }
    }
    const move = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) stop()
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', stop)
    window.addEventListener('scroll', stop, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop); window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', stop); window.removeEventListener('scroll', stop)
      timers.forEach(clearTimeout); layer.current?.querySelectorAll('.pixel-click').forEach(el => el.remove()); stop()
    }
  }, [reduced])
  return <div className="pixel-play" ref={layer} aria-hidden="true">
    <div ref={hold} className="pixel-hold" data-down="false"><i/><i/><i/><i/></div>
    {!reduced && <div key={location.pathname} className="pixel-route"><i/><i/><i/><i/><i/><i/></div>}
  </div>
}
