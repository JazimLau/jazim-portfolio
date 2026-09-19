const names = ['unity-chest-open', 'wow-midsummer-slogan', 'wow-midsummer-product', 'naraka-shangbo-demo', 'nsh-jiuzhou-mijing', 'rd-official-demo', 'ae-sci-fi-win', 'gongxi-gacha', 'dialogue-wheel-previs', 'dialogue-wheel-whitebox']

/** Actual frames from the corresponding video; unknown videos have no borrowed cover. */
export function videoStill(src?: string): string | undefined {
  const name = src?.split('/').pop()?.replace(/\.m3u8$/, '')
  return name && names.includes(name) ? `/assets/stills/${name}.jpg` : undefined
}
