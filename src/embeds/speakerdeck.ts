import { composeQuery, encodePathSegment, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isFileName, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'speakerdeck'

const hosts = ['speakerdeck.com']

const sizes = {
  player: { ratio: '16/9' },
}

// The legacy `/embed/{id}` iframe redirects to `/player/{id}`.
const deckRouteWords = ['player', 'embed']

// Speaker Deck's embed.js appends `data-id` to the player path, so `{id}?slide=N` opens slide N
// on the publisher's page.
const slideSuffixRegex = /\?slide=([^&]+)$/i
const legacyScriptPathRegex = /^\/embed\/([^/]+)\.js$/i

// One feed can embed the same deck at several slides. Without the slide those collapse into
// identical placeholders, and the player url honours `?slide=`.
// The public page needs the author and slug, which neither carrier names, so there is no `url`.
const composeEmbed = (
  deckId: string,
  { slide, title }: { slide?: string; title?: string },
): EmbedResolverResult => {
  const query = composeQuery(slide ? { slide } : undefined)

  return {
    provider,
    id: slide ? `${deckId}/${slide}` : deckId,
    src: `https://speakerdeck.com/player/${deckId}${query}`,
    ...sizes.player,
    title,
  }
}

// Speaker Deck ships a deck as a bare <script data-id> whose embed.js builds the player at runtime.
export const speakerdeckScriptEmbedResolver = createMarkupEmbedResolver(
  'script.speakerdeck-embed[data-id]',
  (element) => {
    const raw = attr(element, 'data-id') ?? ''
    const inlineSlide = raw.match(slideSuffixRegex)?.[1]
    const deckId = raw.replace(slideSuffixRegex, '')

    if (!deckId) {
      return
    }

    const slide = inlineSlide ?? attr(element, 'data-slide') ?? undefined

    // The id comes out of its attribute decoded, and it goes into a path.
    return composeEmbed(encodePathSegment(deckId), { slide })
  },
)

// Speaker Deck's first embed code, a script whose `document.write` emits the `data-id` script
// above with the same deck id.
export const speakerdeckLegacyScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="speakerdeck.com/embed/" i]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), hosts)
    const deckId = url?.pathname.match(legacyScriptPathRegex)?.[1]

    if (!deckId) {
      return
    }

    return composeEmbed(deckId, {})
  },
)

// The player iframe the `data-id` script builds, saved into the feed by a CMS that ran the script
// first, or the legacy `/embed/{id}` iframe.
export const speakerdeckResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [route = '', deckId] = getPathSegments(url)

  // Speaker Deck serves files on its own host, so a file name is an enclosure.
  if (!isAnyOf(route, deckRouteWords) || !deckId || isFileName(deckId)) {
    return
  }

  const slide = getQueryParam(url.searchParams, 'slide')

  return composeEmbed(deckId, { slide, title: attr(element, 'title') })
}

export const speakerdeckIframeEmbedResolver = createUrlEmbedResolver(hosts, speakerdeckResolveEmbed)

export const speakerdeckFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'null' },
]
