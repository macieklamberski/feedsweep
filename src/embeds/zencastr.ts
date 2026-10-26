import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'zencastr'

// `zen.ai` 301s every zencastr.com path, the episode files on `redirect.zen.ai` included.
const hosts = ['zencastr.com', 'zen.ai']

const sizes = {
  // The carrier's box is a pixel square the snippet fixed, not a size the publisher chose.
  // The embed page sets its `aspect-ratio` from the episode's own `videoResolution` and falls
  // back to `1/1`, which is what Zencastr's recorder writes.
  player: { ratio: '1/1' },
}

export const zencastrResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, id, ...rest] = getPathSegments(url)

  // The `embed` route serves no deeper route.
  if (!isAnyOf(route, 'embed') || !id || rest.length) {
    return
  }

  return {
    provider,
    id,
    src: `https://zencastr.com/embed/${id}`,
    // `zencastr.com/z/{id}` is the public episode page, which the blockquote's "View on Zencastr"
    // link opens.
    url: `https://zencastr.com/z/${id}`,
    ...sizes.player,
  }
}

// Zencastr's embed blockquote: a logo and a link that only a loader script swaps for the player.
// Without the script the reader shows a black box with a link and no player.
export const zencastrBlockquoteEmbedResolver = createMarkupEmbedResolver(
  'blockquote.zenplayer[data-episode-href]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'data-episode-href'), hosts)

    if (!url) {
      return
    }

    return zencastrResolveEmbed(url)
  },
)

// A Zencastr episode player iframe, which renders on its own but names no poster or page.
export const zencastrIframeEmbedResolver = createUrlEmbedResolver(hosts, zencastrResolveEmbed)
