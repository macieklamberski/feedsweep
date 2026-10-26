import { getPathSegments, isAnyOf, toMap } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'redcircle'

// The loader is served from `api.podcache.net` and the player it builds from `redcircle.com`, on
// the same path, so one reader covers both.
const redcircleHosts = ['redcircle.com', 'api.podcache.net']

// Fluid in width and fixed in height, both taken from what the loader scripts set on the iframe
// they build: 170 for an episode, and `height: 100%` under a `min-height: 320px` for a show,
// which collapses to the minimum inside the `height: auto` mount the snippet ships.
const sizes = {
  episode: { height: 170 },
  show: { height: 320 },
}

// `embedded-show-webplayer` is the show player's real page: `embedded-show-player` answers 404.
const routes = toMap<'episode' | 'show'>({
  'embedded-player': 'episode',
  'embedded-show-player': 'show',
  'embedded-show-webplayer': 'show',
})

// The episode player takes both ids: RedCircle addresses an episode under its show, so neither
// uuid on its own rebuilds the endpoint.
const readSubject = (
  segments: Array<string>,
): { kind: 'episode' | 'show'; show: string; episode?: string } | undefined => {
  const [route, ...rest] = segments
  const kind = route ? routes.get(route.toLowerCase()) : undefined

  if (!kind) {
    return
  }

  // Only the webplayer spells the show id bare; the two loader paths put `sh` in front of it.
  const show = isAnyOf(route, 'embedded-show-webplayer') ? rest[0] : rest[1]

  if (!show || (!isAnyOf(route, 'embedded-show-webplayer') && !isAnyOf(rest[0], 'sh'))) {
    return
  }

  if (kind === 'show') {
    return { kind, show }
  }

  const episode = isAnyOf(rest[2], 'ep') ? rest[3] : undefined

  if (!episode) {
    return
  }

  return { kind, show, episode }
}

export const redcircleResolveEmbed: ResolveUrlEmbed = (url) => {
  const subject = readSubject(getPathSegments(url))

  if (!subject) {
    return
  }

  if (subject.kind === 'show') {
    return {
      provider,
      id: `show/${subject.show}`,
      src: `https://redcircle.com/embedded-show-webplayer/${subject.show}`,
      url: `https://redcircle.com/shows/${subject.show}`,
      ...sizes.show,
    }
  }

  return {
    provider,
    id: `episode/${subject.show}/${subject.episode}`,
    src: `https://redcircle.com/embedded-player/sh/${subject.show}/ep/${subject.episode}`,
    url: `https://redcircle.com/shows/${subject.show}/episodes/${subject.episode}`,
    ...sizes.episode,
  }
}

// RedCircle's embed code: a loader script on api.podcache.net beside an empty div only it fills.
// The mount is div.redcirclePlayer-{episode}, and the player path on redcircle.com renders a blank
// page for an invented episode.
export const redcircleScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="podcache.net/embedded-" i]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), redcircleHosts)

    if (!url) {
      return
    }

    return redcircleResolveEmbed(url)
  },
)

export const redcircleIframeEmbedResolver = createUrlEmbedResolver(
  redcircleHosts,
  redcircleResolveEmbed,
)
