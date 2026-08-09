/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 私密联系方式（构建时注入，不入库）：联系邮箱 */
  readonly VITE_CONTACT_EMAIL?: string
  /** 私密联系方式（构建时注入，不入库）：手机号 */
  readonly VITE_CONTACT_PHONE?: string
  /** 私密联系方式（构建时注入，不入库）：微信 ID */
  readonly VITE_CONTACT_WECHAT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
