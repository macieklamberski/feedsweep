import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A guide id is a kind letter and digits: `s` for a station, `p` for a program, `t` for a topic.
const guideIdRegex = /^([spt])\d+$/

// Stations and programs carry a logo on the cdn, keyed by the guide id alone. Topics have none.
const logoKinds = new Set(['s', 'p'])

// TuneIn's player, `tunein.com/embed/player/{guideId}/`. The player page answers a real and a
// fabricated id alike, and the page on `tunein.com/radio/{guideId}/` resolves a real id and 404s
// a fabricated one.
export const tuneinResolveEmbed: ResolveEmbed = (url) => {
  const [embed, player, guideId, ...rest] = getPathSegments(url)
  const kind = guideId?.match(guideIdRegex)?.[1]

  if (embed !== 'embed' || player !== 'player' || !guideId || !kind || rest.length) {
    return
  }

  return {
    provider: 'tunein',
    id: guideId,
    src: `https://tunein.com/embed/player/${guideId}/`,
    url: `https://tunein.com/radio/${guideId}/`,
    thumbnail: logoKinds.has(kind)
      ? `https://cdn-radiotime-logos.tunein.com/${guideId}d.png`
      : undefined,
  }
}

export const tuneinEmbedResolver = createUrlEmbedResolver(['tunein.com'], tuneinResolveEmbed)
