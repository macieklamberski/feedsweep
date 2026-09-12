import { nicovideoResolveEmbed } from '../../embeds/nicovideo.js'
import { readYoutubeEmbedSrc } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { parsePixelSize } from '../../utils/dom.js'
import { createIframe, setDimensions } from '../../utils/widgets.js'

type ExternalVideoConfig = {
  url?: string
  width?: string
  height?: string
}

const loaderSelector = 'script[src*="/contents/js/external_video.js"]'

// The inline script assigns one global: extVideoConfig = {"width":"480","height":"320","url":"…"};
const configRegex = /extVideoConfig\s*=\s*(\{[^}]*\})/

const readConfig = (script: Element): ExternalVideoConfig | undefined => {
  const json = script.textContent?.match(configRegex)?.[1]

  if (!json) {
    return
  }

  try {
    return JSON.parse(json)
  } catch {}
}

// Each loader follows its own config, so the nearest inline script before it is the one that
// names its video when an item holds several players.
const findConfigScript = (loader: Element): Element | undefined => {
  for (let node = loader.previousElementSibling; node; node = node.previousElementSibling) {
    if (node.localName === 'script' && node.textContent?.includes('extVideoConfig')) {
      return node
    }
  }
}

// Seesaa's and Sakura's blog video block is an inline config beside a loader script that writes
// the player client-side, so the pipeline drops the loader and no player is left. The config
// names a YouTube or Nicovideo page and the box the publisher chose.
export const rebuildExternalVideoEmbeds: DomTransform = () => {
  return (document) => {
    for (const loader of document.querySelectorAll(loaderSelector)) {
      const script = findConfigScript(loader)

      if (!script) {
        continue
      }

      const config = readConfig(script)
      const url = config?.url ?? ''
      const src = readYoutubeEmbedSrc(url) ?? nicovideoResolveEmbed(url)?.src

      if (!src) {
        continue
      }

      const iframe = createIframe(document, src)

      setDimensions(iframe, {
        width: parsePixelSize(config?.width),
        height: parsePixelSize(config?.height),
      })
      script.remove()
      loader.replaceWith(iframe)
    }
  }
}
