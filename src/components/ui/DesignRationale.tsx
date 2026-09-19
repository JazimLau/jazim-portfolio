import { useUI } from '../../context/UIContext'
import { rationales } from '../../data/rationales'

export function DesignRationale({ id }: { id?: string }) {
  const { t, tx } = useUI()
  const rationale = id ? rationales[id] : undefined
  if (!rationale) return null
  return <section className="design-rationale"><h2>{t('设计判断', 'Design rationale')} <span>DESIGN RATIONALE</span></h2><div>{rationale.map(item => <article key={item.label.en}><h3>{tx(item.label)}</h3><p>{tx(item.text)}</p></article>)}</div></section>
}
