/**
 * 全局播放互斥：同一时间只允许一个视频出声播放。
 * 任何 <video> 开始播放时，先暂停上一个正在播放的，避免切项目 / 切视频 /
 * 打开案例查看器时多个视频同时出声（尤其首页轮播多张卡片并存时）。
 */

let activeVideoEl: HTMLVideoElement | null = null

/** 声明播放权：暂停其它正在播放的视频，再把自己设为当前播放者 */
export function claimPlayback(v: HTMLVideoElement) {
  if (activeVideoEl && activeVideoEl !== v && !activeVideoEl.paused) {
    activeVideoEl.pause()
  }
  activeVideoEl = v
}

/** 释放播放权：仅当该元素当前持有播放权时清空 */
export function releasePlayback(v: HTMLVideoElement) {
  if (activeVideoEl === v) activeVideoEl = null
}

/** 暂停当前正在播放的视频（若有），并清空播放权 */
export function pauseActiveVideo() {
  if (activeVideoEl && !activeVideoEl.paused) {
    activeVideoEl.pause()
  }
  activeVideoEl = null
}
