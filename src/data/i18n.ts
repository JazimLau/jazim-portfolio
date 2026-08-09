/* =========================================================================
   i18n.ts — 双语内容的最小抽象
   数据里所有面向用户的中文文案都写成 lt('中文', 'English')，
   两种语言并排放在一起，改一处就能同时看到对照，不容易漂移。
   纯英文内容（代号、标签、工具名）保持普通字符串，无需包装。
   ========================================================================= */

export type Lang = 'CN' | 'EN'

/** Localized Text：一条文案的中英两个版本 */
export interface LT {
  cn: string
  en: string
}

/** 构造双语文案。写法短，便于在数据文件里大量使用。 */
export const lt = (cn: string, en: string): LT => ({ cn, en })

/** 可能是双语，也可能是不需要翻译的纯字符串 */
export type MaybeLT = LT | string

/** 按当前语言取值 */
export function resolveLT(v: MaybeLT, lang: Lang): string {
  if (typeof v === 'string') return v
  return lang === 'CN' ? v.cn : v.en
}

/** 批量解析数组 */
export function resolveList(list: readonly MaybeLT[], lang: Lang): string[] {
  return list.map((v) => resolveLT(v, lang))
}

/** 语言切换按钮上显示的标签 */
export const LANG_META: Record<Lang, { code: string; label: LT }> = {
  CN: { code: 'CN', label: lt('简体中文', 'Simplified Chinese') },
  EN: { code: 'EN', label: lt('英文', 'English') },
}
