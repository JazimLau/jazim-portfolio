import { useEffect } from 'react'
import type { DependencyList, RefObject } from 'react'
import { gsap, ScrollTrigger, repairScrollTriggerGuard } from '../lib/gsap'

/**
 * 在 gsap.context 内建立动画，组件卸载时自动 revert。
 * 这样所有 tween、ScrollTrigger 和内联样式都会被回收，不会泄漏。
 *
 * 竞态自愈：组件 mount 时创建的 ScrollTrigger 其构造器内部会触发一次
 * refresh()，若此时恰逢全局 refresh（_refreshAll 正在遍历/增删 _triggers
 * 数组），会偶发 “Cannot read properties of undefined (reading 'end')”
 * 错误，导致该组件的入场动画静默丢失。这里在 setup 失败时自动等待本轮
 * refresh 结束，然后在同一个 ctx 内重建一次动画，保证动画不丢失。
 *
 * 注意：该错误还会把 ScrollTrigger 内部的 _refreshing 刷新守卫卡死，之后
 * 所有 trigger 的 start/end 都停在 0、动画永不触发（内容缺失）。因此重试前
 * 必须先用 repairScrollTriggerGuard() 解开守卫，否则重建的动画同样失效。
 *
 * @param setup  在 context 内执行的动画构建函数
 * @param deps   依赖数组，变化时重建动画
 * @param scope  作用域元素，传入后 setup 里可直接用选择器字符串
 */
export function useGsapContext(
  setup: (context: gsap.Context) => void,
  deps: DependencyList = [],
  scope?: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    let cancelled = false
    let retried = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    // try/catch 放在 setup 内部而非包住整个 context，保证 ctx 始终创建成功。
    // 注意：gsap.context() 构造时会同步执行回调，回调内只能用 self 引用
    // 自身，不能引用外层尚未赋值的 ctx 变量（会触发 TDZ 错误）。
    const ctx = gsap.context(
      (self) => {
        try {
          setup(self)
        } catch (err) {
          if (cancelled || retried) {
            console.warn('[useGsapContext] animation setup failed:', err)
            return
          }
          retried = true
          // 撤销本轮已创建的部分动画，等待 refresh 结束后在同一 ctx 内重建。
          self.revert()
          // 解除被卡死的刷新守卫，否则重试重建的 trigger 位置仍会停在 0、动画不触发。
          repairScrollTriggerGuard()
          const retry = () => {
            if (cancelled) return
            ScrollTrigger.removeEventListener('refresh', retry)
            if (retryTimer) clearTimeout(retryTimer)
            try {
              // add() 会把 setup 立即作为 context 回调执行，动画归属同一 ctx
              self.add(setup)
            } catch (err2) {
              console.warn('[useGsapContext] animation setup retry failed:', err2)
            }
          }
          ScrollTrigger.addEventListener('refresh', retry)
          // 兜底：极端情况下本轮 refresh 事件不再触发，定时器也会重试一次
          retryTimer = setTimeout(retry, 320)
        }
      },
      scope?.current ?? undefined
    )
    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      ctx.revert()
    }
    // setup 每次渲染都是新函数，故只依赖调用方声明的 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
