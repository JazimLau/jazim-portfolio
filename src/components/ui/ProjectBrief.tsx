import type { CaseDetail, Project } from '../../data/types'
import { useUI } from '../../context/UIContext'
import { METRIC_CN } from '../../data/labels'
import type { MaybeLT } from '../../data/i18n'

export function ProjectBrief({ project, detail, role, caseLevel = false }: { project: Project; detail?: CaseDetail; role?: MaybeLT; caseLevel?: boolean }) {
  const { t, tx, txList, lang } = useUI()
  const objective = detail?.objectives[0] ?? (!caseLevel ? project.sections.find(s => s.id === 'objective')?.list?.[0] : undefined)
  const result = detail?.result ?? project.sections.find(s => s.id === 'result')?.body?.[0]
  return <dl className="project-brief">
    <div><dt>{t('我的职责', 'MY ROLE')}</dt><dd>{role ? tx(role) : txList(project.role).join(' / ')}</dd></div>
    {objective && <div><dt>{t('解决什么', 'OBJECTIVE')}</dt><dd>{tx(objective)}</dd></div>}
    <div><dt>{t('交付结果', 'RESULT')}</dt><dd>{detail && result ? tx(result) : caseLevel ? t('见本页作品演示；暂无独立成果数据。', 'See the work on this page; no separate outcome metrics are available.') : project.metrics.length ? project.metrics.slice(0,4).map(m => `${tx(m.value)} ${lang === 'CN' ? METRIC_CN[m.label] ?? m.label : m.label}`).join(' / ') : result ? tx(result) : t('详见各案例中的作品与交付说明', 'See individual cases for deliverables.')}</dd></div>
  </dl>
}
