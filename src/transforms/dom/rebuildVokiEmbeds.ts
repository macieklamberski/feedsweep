import { composePlayerUrl } from '../../embeds/voki.js'
import type { DomTransform } from '../../types.js'
import { createIframe } from '../../utils/widgets.js'

// `AC_Voki_Embed(width, height, chsm, sc, …)`, with the `chsm` quoted and the `sc` bare.
const embedCallRegex =
  /AC_Voki_Embed\([^,]*,[^,]*,\s*(?<quote>['"])(?<chsm>[^'"]+)\k<quote>,\s*(?<sc>[^,)\s]+)/g

// Voki's script embed: an inline `AC_Voki_Embed` call naming the scene, which only the
// `voki_embed_functions.php` loader turns into a player, so the feed shows nothing.
export const rebuildVokiEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll('script')) {
    const frames: Array<Element> = []

    for (const match of (script.textContent ?? '').matchAll(embedCallRegex)) {
      if (!match.groups) {
        continue
      }

      const playerUrl = composePlayerUrl(match.groups.sc, match.groups.chsm)
      frames.push(createIframe(document, playerUrl))
    }

    if (frames.length === 0) {
      continue
    }

    script.replaceWith(...frames)
  }
}
