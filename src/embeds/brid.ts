import { decodeSegment } from 'trousse'
import type { EmbedRenderHint } from '../types.js'
import { findConfigScript } from '../utils/dom.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'brid'

// The inline script's config comes in two spellings, `$bp("Brid_{n}", {...})` and
// `_bp.push({"div": "Brid_{n}", "obj": {...}})`. `id` is the player, `video` the video, and the
// title is percent-encoded.
const containerIdRegex = /Brid_[\w-]+/g
const playerIdRegex = /"id"\s*:\s*"?([^",}\s]+)"?/
const videoIdRegex = /"video"\s*:\s*"?([^",}\s]+)"?/
const titleRegex = /"title"\s*:\s*"([^"]+)"/

// Brid.tv embeds a player as an empty div plus an inline config script no reader runs.
// The poster lives under a partner id the markup never names.
export const bridEmbedResolver = createMarkupEmbedResolver('div.brid[id^="Brid_"]', (element) => {
  const script = findConfigScript(element)
  const text = script?.textContent ?? ''
  // Read after the div's own id, so a script holding several configs yields the right one.
  const config = text.slice(text.indexOf(element.id))
  const playerId = config.match(playerIdRegex)?.[1]
  const videoId = config.match(videoIdRegex)?.[1]

  if (!playerId || !videoId) {
    return
  }

  // Removed only once it has nothing left to say: one script often configures every container.
  if ((text.match(containerIdRegex)?.length ?? 0) < 2) {
    script?.remove()
  }

  const title = config.match(titleRegex)?.[1]

  return {
    provider,
    // The player scopes the video the way a partner scopes a Kaltura entry, so it leads the
    // id, which is the order every other two-part id in the tree uses. The minted url keeps
    // Brid's own `/video/{video}/{player}` order, which is the platform's, not ours.
    id: `${playerId}/${videoId}`,
    // The url keeps Brid's own video-then-player order, the reverse of the id.
    // It is the page the loader's own code opens as its iframe player. A retired player id falls
    // back to the partner's current one, and a retired partner does not.
    src: `https://services.brid.tv/services/iframe/video/${videoId}/${playerId}`,
    ratio: '16/9',
    title: decodeSegment(title) ?? title,
  }
})

// The player posts `Brid|{player uid}|trigger|ready` once it has loaded.
export const isBridReady = (data: unknown): boolean => {
  return typeof data === 'string' && data.startsWith('Brid|') && data.endsWith('|trigger|ready')
}

// The player runs a string command `Brid|{method}`, and ignores it while an ad plays.
export const bridRenderHint: EmbedRenderHint = {
  provider,
  isReady: isBridReady,
  requestPlay: 'Brid|play',
}
