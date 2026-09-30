import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A guide id opens with its kind letter: `s` for a station, `p` for a program, `t` for a topic.
const guideIdRegex = /^([a-z])/

// A topic 404s on `/radio/` and has no cdn logo. Its page needs the parent program id, which the
// player url does not carry.
const pageKinds = ['s', 'p']

// TuneIn's player, `tunein.com/embed/player/{guideId}/`. The player page answers a real and a
// fabricated id alike. A station or program page on `tunein.com/radio/{guideId}/` redirects for a
// real id and 404s a fabricated one, and its logo sits on the cdn under the guide id.
export const tuneinResolveEmbed: ResolveEmbed = (url) => {
  const [embed, player, guideId, ...rest] = getPathSegments(url)
  const kind = guideId?.match(guideIdRegex)?.[1]

  if (embed !== 'embed' || player !== 'player' || !guideId || !kind || rest.length) {
    return
  }

  const hasPage = pageKinds.includes(kind)

  return {
    provider: 'tunein',
    id: guideId,
    src: `https://tunein.com/embed/player/${guideId}/`,
    url: hasPage ? `https://tunein.com/radio/${guideId}/` : undefined,
    thumbnail: hasPage ? `https://cdn-radiotime-logos.tunein.com/${guideId}d.png` : undefined,
  }
}

export const tuneinEmbedResolver = createUrlEmbedResolver(['tunein.com'], tuneinResolveEmbed)
