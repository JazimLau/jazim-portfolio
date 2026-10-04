import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useUI } from '../../context/UIContext'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { VideoPreview } from '../ui/VideoPreview'
import { getProjectBySlug, caseCoverPath } from '../../data/projects'
import { videoStill } from '../../data/videoStills'
import { siteAsset } from '../../lib/media'
import styles from './WorkFirst.module.css'

const ui = getProjectBySlug('game-ui-motion-studies')!
const commercial = getProjectBySlug('leihuo-external-motion-system')!
const ae = ui.cases!.find(c => c.id === 'ae-previs')!
const ue = ui.cases!.find(c => c.id === 'ue5')!
const dialogue = ae.works!.find(w => w.id === 'dialogue-wheel-previs')!
const whitebox = ue.works!.find(w => w.id === 'dialogue-wheel-whitebox')!
const unity = ui.cases!.find(c => c.id === 'unity')!
const unityWork = unity.works!.find(w => w.id === 'unity-chest-open')!
function uiClips(module: typeof ae, ids: string[]) {
  return ids.flatMap(id => {
    const work = module.works!.find(w => w.id === id)!
    return work.videos.map((video, index) => ({
      video,
      name: work.name,
      part: work.videos.length > 1 ? ` · ${index + 1}/${work.videos.length}` : '',
      to: `/projects/${ui.slug}/case/${module.id}?work=${id}`,
    }))
  })
}
const featuredWorks = [
  [['wow', 'wow-midsummer'], ['naraka', 'naraka-shangbo'], ['nsh', 'nsh-jiuzhou-mijing'], ['rd', 'rd-official-demo']].flatMap(([caseId, workId]) => {
    const c = commercial.cases!.find(c => c.id === caseId)!
    const work = c.works!.find(w => w.id === workId)!
    return (workId === 'wow-midsummer' ? work.videos.slice(0, 1) : work.videos).map((video, i) => ({ video, name: work.name, part: work.videos.length > 1 ? ` · ${i + 1}/${work.videos.length}` : '', to: `/projects/${commercial.slug}/case/${caseId}?work=${workId}` }))
  }),
  uiClips(ae, ['sichuan-opera-event', 'medieval-magic-character', 'ae-sci-fi-win', 'gongxi-gacha', 'dialogue-wheel-previs', 'ae-7day-signin']),
  uiClips(ue, ['anime-battle-entry', 'dialogue-wheel-whitebox']),
  uiClips(unity, ['unity-7day-signin', 'anime-wish', 'unity-chest-open']),
]
const picks = [
  { project: commercial, cover: commercial.cover, video: commercial.video, to: `/projects/${commercial.slug}`, code: 'COMMERCIAL GAME MOTION', name: ['网易雷火', 'NetEase Leihuo'], kind: ['商业项目 · 动效设计', 'Commercial · Motion design'], role: ['动效方案 / AE 预演 / 资源交付 / 上线走查', 'Motion specs / AE previs / Asset delivery / QA'], result: ['实习累计：21个官网／活动等动效项目 · 97组资源 · 全部已上线', 'Internship totals: 21 motion projects for official websites, events and related formats · 97 asset sets · All launched'] },
  { project: ui, cover: caseCoverPath(ui, ae), video: dialogue.videos[0], to: `/projects/${ui.slug}/case/ae-previs?work=${dialogue.id}`, code: 'GAME UI MOTION', name: [ae.name.cn, ae.name.en], kind: ['个人练习 · 交互与动效', 'Personal practice · Interaction & motion'], role: ['视觉层级 / 交互节奏 / AE 动效预演', 'Visual hierarchy / Interaction pacing / AE previs'], result: ['胜利结算 / 抽卡反馈 / 对话轮盘', 'Victory settlement / Gacha reward / Dialogue wheel'] },
  { project: ui, cover: caseCoverPath(ui, ue), video: whitebox.videos[0], to: `/projects/${ui.slug}/case/ue5`, code: 'REAL-TIME UE5', name: [ue.name.cn, ue.name.en], kind: ['引擎实践 · UI 动效与交互', 'Engine practice · UI motion & interaction'], role: ['UMG 界面 / Blueprint / 事件驱动交互', 'UMG / Blueprint / Event-driven interaction'], result: ['战斗入口 / 对话轮盘 / UMG 界面动效', 'Battle entry / Dialogue wheel / UMG motion'] },
  { project: ui, cover: caseCoverPath(ui, unity), video: unityWork.videos[0], to: `/projects/${ui.slug}/case/unity`, code: 'REAL-TIME UNITY', name: [unity.name.cn, unity.name.en], kind: ['引擎实践 · UI 与实时特效', 'Engine practice · UI & real-time FX'], role: ['UI 动画 / Shader / Particle System', 'UI animation / Shader / Particle System'], result: ['界面动态表现 / 实时材质 / 粒子反馈', 'Interface motion / Real-time materials / Particle feedback'] },
]

export function WorkFirst() {
  const { t, tx, projectsState, setProjectsState } = useUI()
  const reduced = useReducedMotion()
  const [active, setActive] = useState(1)
  const [clipIndex, setClipIndex] = useState(0)
  const playlist = featuredWorks[active]
  const clip = playlist[Math.min(clipIndex, playlist.length - 1)]
  const remember = () => setProjectsState({ ...projectsState, scrollY: window.scrollY })
  return <>
    <section id="home" className={`${styles.hero} shell`}>
      <div className={styles.intro}>
        <div><p className={styles.eyebrow}>JAZIM LAU / 刘俊熙</p><h1>GAME UI<br /><span>MOTION DESIGNER.</span></h1></div>
        <p className={styles.statement}>{t('用动效建立视觉层级，\n让每一次交互都有清晰反馈。', 'Motion that guides attention.\nFeedback that makes interaction clear.')}</p>
      </div>
      <div className={styles.stage}>
        <div className={styles.screen}>
          <VideoPreview key={active} videos={playlist.map(v => v.video)} videoIndex={clipIndex} onVideoChange={setClipIndex} cover={videoStill(clip.video)} alt={tx(clip.name)} mode={reduced ? 'manual' : 'auto'} lazy={false} loopVideo={false} category={tx(clip.name) + clip.part} />
        </div>
        <aside className={styles.rail}>
          <p className={styles.eyebrow}>{t('精选动效 / SELECTED MOTION', 'SELECTED MOTION')}</p>
          <h2>{t('先看作品。', 'See the work.')}</h2>
          <p className={styles.note}>{t('从视觉预演到实时交互', 'From visual previs to real-time interaction')}</p>
          <div className={styles.choices}>{picks.map((p, i) => <button key={p.code} type="button" className={`${styles.choice} ${i === active ? styles.active : ''}`} aria-pressed={i === active} onClick={() => { setActive(i); setClipIndex(0) }}><span className={styles.number}>0{i+1}</span><span><strong>{t(...p.name as [string,string])}</strong><small>{p.code}</small></span><ArrowUpRight size={20}/></button>)}</div>
          <Link className={styles.primary} to={clip.to} onClick={remember}>{t('查看当前作品详情', 'View current work')}<ArrowRight size={18}/></Link>
          <p className={styles.note}>{t('默认静音 · 可暂停 / 全屏观看', 'Muted by default · Pause / Fullscreen')}</p>
        </aside>
      </div>
    </section>
    <section id="selected" className={`${styles.selected} shell`}>
      <div className={styles.sectionHead}><h2>{t('精选作品', 'Selected work')}<span> / SELECTED WORK</span></h2><span>01 — {String(picks.length).padStart(2, '0')}</span></div>
      <div className={styles.cards}>{picks.map((p,i) => <Link key={p.code} className={styles.card} to={featuredWorks[i][0].to} onClick={remember}>
        <div className={styles.thumb}><img src={siteAsset(videoStill(featuredWorks[i][0].video))} alt={tx(featuredWorks[i][0].name)} loading="lazy"/><span>0{i+1} / {p.code}</span><ArrowUpRight size={26}/></div>
        <div className={styles.cardBody}><p className={styles.eyebrow}>{t(...p.kind as [string,string])}</p><h3>{t(...p.name as [string,string])}</h3><p>{t(...p.role as [string,string])}</p><p className={styles.result}>{t(...p.result as [string,string])}</p><span className={styles.cardLink}>{t('观看项目', 'View project')} <ArrowRight size={16}/></span></div>
      </Link>)}</div>
      <div className={styles.more}><a href={siteAsset('/assets/files/Jazim-Lau-Portfolio.pdf')} download>{t('下载作品集 PDF ↓', 'PORTFOLIO PDF ↓')}</a><span>{t('更多作品', 'Explore more')}</span><Link to="/projects/game-ui-motion-studies">GAME UI MOTION ↗</Link><Link to="/projects/leihuo-external-motion-system/case/tianyu">AI WORKFLOW ↗</Link><Link to="/projects/game-ad-films">VIDEO WORK ↗</Link></div>
    </section>
  </>
}
