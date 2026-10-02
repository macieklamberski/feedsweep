import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const podomaticHost = 'podomatic.com'

// The html5 player, measured in Chrome at 320, 480, 640 and 960 pixels wide and 300 and 700 tall:
// 208 at every size, so a fixed height on a fluid width and never a ratio.
const html5Height = 208

// The current player, measured at 203 wide and 216 narrow because the episode title wraps. 205 is
// what Podomatic's own snippet writes on all 11 frames in the corpus, and it sits between the two.
const currentHeight = 205

type Player = { kind: string; id: string; src: string; height: number }

const readPlayer = (url: URL): Player | undefined => {
  const segments = getPathSegments(url)

  if (segments[0] !== 'embed') {
    return
  }

  // `embed/html5/{episode|podcast}/{id}`. Any other kind answers 404.
  if (segments[1] === 'html5' && segments[2]) {
    const kind = segments[2]
    const id = segments[3] ?? ''

    return {
      kind,
      id,
      src: `https://podomatic.com/embed/html5/${kind}/${id}`,
      height: html5Height,
    }
  }

  // embed/v2/podcast/{podcast}?episode_id={episode} is the snippet Podomatic hands out today, and
  // its episode_id is the id the html5 route takes in its path.
  if (segments[1] === 'v2' && segments[2] === 'podcast') {
    const podcast = segments[3]

    if (!podcast) {
      return
    }

    const episode = url.searchParams.get('episode_id') ?? ''
    const named = episode ? composeQuery({ episode_id: episode }) : ''

    return {
      kind: named ? 'episode' : 'podcast',
      id: named ? episode : podcast,
      src: `https://podomatic.com/embed/v2/podcast/${podcast}${named}`,
      height: currentHeight,
    }
  }
}

export const podomaticResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, podomaticHost)
  const player = parsed && readPlayer(parsed)

  if (!player?.id) {
    return
  }

  return {
    provider: 'podomatic',
    // Qualified by kind because the two id spaces share one grammar, and because the endpoint an
    // enricher would call differs: `embed/html5/episode/{id}` and `embed/html5/podcast/{id}` each
    // answer with the canonical page, the feed url and the title of what they hold.
    id: `${player.kind}/${player.id}`,
    src: player.src,
    height: player.height,
  }
}

export const podomaticEmbedResolver = createUrlEmbedResolver([podomaticHost], podomaticResolveEmbed)
