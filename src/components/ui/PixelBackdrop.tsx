import type { CSSProperties } from 'react'
import './PixelBackdrop.css'

// Fixed, deterministic positions keep the atmosphere quiet and avoid layout shifts.
export function PixelBackdrop() {
  return <div className="pixel-backdrop" aria-hidden="true">
    <div className="pixel-backdrop-grid" />
    {Array.from({ length: 26 }, (_, i) => <i key={i} className={`pixel-mote ${i % 5 === 0 ? 'pixel-mote-cross' : ''}`} style={{
      left: `${(i * 37 + 3) % 100}%`, top: `${(i * 23 + 7) % 100}%`,
      '--delay': `${-(i * 1.7)}s`, '--duration': `${14 + i % 7 * 3}s`,
      '--tint': i % 3 === 0 ? '#8b6bff' : '#bcff65',
    } as CSSProperties} />)}
    <span className="pixel-hud pixel-hud-left"><i/><i/><i/></span>
    <span className="pixel-hud pixel-hud-right"><i/><i/><i/></span>
    <span className="pixel-trace pixel-trace-left"/>
    <span className="pixel-trace pixel-trace-right"/>
  </div>
}
