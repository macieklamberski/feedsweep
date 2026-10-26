import { composeQuery, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'podomatic'

const hosts = ['podomatic.com']

const sizes = {
  // The html5 player, measured in Chrome at 320, 480, 640 and 960 pixels wide and 300 and 700
  // tall: 208 at every size, so a fixed height on a fluid width and never a ratio.
  html5: { height: 208 },
  // The current player, measured at 203 wide and 216 narrow because the episode title wraps. 205
  // is what Podomatic's own snippet writes on all 11 frames in the corpus, and it sits between the
  // two.
  current: { height: 205 },
}

type Player = { kind: string; id: string; src: string; size: { height: number } }

const readPlayer = (url: URL): Player | undefined => {
  const [route, player, kind, slug] = getPathSegments(url)

  if (!isAnyOf(route, 'embed')) {
    return
  }

  // `embed/html5/{episode|podcast}/{id}`. Any other kind answers 404.
  if (isAnyOf(player, 'html5') && kind) {
    const id = slug ?? ''

    return {
      kind,
      id,
      src: `https://podomatic.com/embed/html5/${kind}/${id}`,
      size: sizes.html5,
    }
  }

  // embed/v2/podcast/{podcast}?episode_id={episode} is the snippet Podomatic hands out today, and
  // its episode_id is the id the html5 route takes in its path.
  if (isAnyOf(player, 'v2') && isAnyOf(kind, 'podcast')) {
    const podcast = slug

    if (!podcast) {
      return
    }

    const episode = getQueryParam(url.searchParams, 'episode_id') ?? ''
    const named = episode ? composeQuery({ episode_id: episode }) : ''

    return {
      kind: named ? 'episode' : 'podcast',
      id: named ? episode : podcast,
      src: `https://podomatic.com/embed/v2/podcast/${podcast}${named}`,
      size: sizes.current,
    }
  }
}

export const podomaticResolveEmbed: ResolveUrlEmbed = (url) => {
  const player = readPlayer(url)

  if (!player?.id) {
    return
  }

  return {
    provider,
    // Qualified by kind because the two id spaces share one grammar, and because the endpoint an
    // enricher would call differs: `embed/html5/episode/{id}` and `embed/html5/podcast/{id}` each
    // answer with the canonical page, the feed url and the title of what they hold.
    id: `${player.kind}/${player.id}`,
    src: player.src,
    ...player.size,
  }
}

// Podomatic's player iframe, the html5 player `embed/html5/{kind}/{id}` and the current snippet
// `embed/v2/podcast/{podcast}?episode_id={episode}`.
export const podomaticEmbedResolver = createUrlEmbedResolver(hosts, podomaticResolveEmbed)
