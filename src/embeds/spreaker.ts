import { composeQuery, encodePathSegment, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { digitsRegex, pickQueryParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'spreaker'

const hosts = ['spreaker.com']

// An episode player, or a show player that plays the latest episode.
const embedKinds = { episode_id: 'episode', show_id: 'show' } as const

// Whether the player lists the show's episodes under the one playing, `false` or `show`.
const playerParams = ['playlist']

const sizes = {
  // The height Spreaker documents in its own embed snippet, `height="200px"`.
  player: { height: 200 },
}

export const extractSpreakerEmbed = (
  url: URL,
): { kind: string; param: string; id: string } | undefined => {
  // The route is `player` on the widget host and `embed/player/{variant}` on the site host,
  // read as a whole segment so a longer name starting with it is not the player route.
  if (!getPathSegments(url).some((segment) => isAnyOf(segment, 'player'))) {
    return
  }

  for (const [param, kind] of Object.entries(embedKinds)) {
    const id = getQueryParam(url.searchParams, param)

    if (!id) {
      continue
    }

    // An episode id outside the class refuses the carrier, never falling through to the show.
    if (!digitsRegex.test(id)) {
      return
    }

    return { kind, param, id }
  }
}

// Spreaker's player iframe ships no height attribute, so a reader reserves nothing for it.
// Spreaker's oEmbed answers the show url minted here. It refuses an episode url without the slug,
// which the carrier lacks, so an episode is read from `api.spreaker.com/v2/episodes/{id}`.
export const spreakerResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const embed = extractSpreakerEmbed(url)

  if (!embed) {
    return
  }

  const title = attr(element, 'title')
  const query = composeQuery({
    [embed.param]: embed.id,
    ...pickQueryParams(url.search, playerParams),
  })

  // Both kinds name a page that takes the bare id and redirects to its canonical slugged form,
  // `/episode/{id}` and `/show/{id}`, so the click target is the resource the player plays.
  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://widget.spreaker.com/player${query}`,
    // The query id comes out decoded, and it goes into the page path.
    url: `https://www.spreaker.com/${embed.kind}/${encodePathSegment(embed.id)}`,
    ...sizes.player,
    title,
  }
}

export const spreakerIframeEmbedResolver = createUrlEmbedResolver(hosts, spreakerResolveEmbed)

// Spreaker's anchor snippet, which only a widgets.js loader swaps for the player at runtime.
// Feeds carrying the loader mostly hold no player iframe anywhere, so a reader sees the anchor's
// fallback text, "Listen to ... on Spreaker", and no player at all.
export const spreakerAnchorEmbedResolver = createMarkupEmbedResolver(
  // Without data-resource the anchor is an ordinary link: the class is styling anyone can copy.
  // The feeds that carry the class without the attribute do not ship the loader script either.
  'a.spreaker-player[data-resource]',
  (element) => {
    // The resource is spelled as a query fragment, `data-resource="episode_id=42"`. The anchor's
    // own href can name the show while the resource names an episode.
    const resource = attr(element, 'data-resource')
    const result = resource
      ? spreakerResolveEmbed(new URL(`https://widget.spreaker.com/player?${resource}`))
      : undefined

    if (!result) {
      return
    }

    // The anchor text is a localized call to action around the title, not the title itself, and
    // the quote characters wrapping the title differ per language.
    const title = attr(element, 'data-title')

    return {
      ...result,
      title,
    }
  },
)

// The documented autoplay=true does nothing: the player bundle holds no code for it.
export const spreakerRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
