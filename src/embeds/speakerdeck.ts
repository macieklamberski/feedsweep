import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, isFileName, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'speakerdeck'

const speakerdeckHosts = ['speakerdeck.com']

// The legacy `/embed/{id}` iframe redirects to `/player/{id}`.
const deckRouteWords = ['player', 'embed']

// A few feeds fold the slide number into the id attribute itself.
const slideSuffixRegex = /\?slide=([^&]+)$/
const legacyScriptPathRegex = /^\/embed\/([^/]+)\.js$/

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
    ratio: '16/9',
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

    return composeEmbed(deckId, { slide })
  },
)

// Speaker Deck's first embed code, a script whose `document.write` emits the `data-id` script
// above with the same deck id.
export const speakerdeckLegacyScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="speakerdeck.com/embed/"]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), speakerdeckHosts)
    const deckId = url?.pathname.match(legacyScriptPathRegex)?.[1]

    if (!deckId) {
      return
    }

    return composeEmbed(deckId, {})
  },
)

// The player iframe the `data-id` script builds, saved into the feed by a CMS that ran the script
// first, or the legacy `/embed/{id}` iframe.
export const speakerdeckResolveEmbed: ResolveEmbed = (url, element) => {
  const [route = '', deckId] = getPathSegments(url)

  // Speaker Deck serves files on its own host, so a file name is an enclosure.
  if (!deckRouteWords.includes(route) || !deckId || isFileName(deckId)) {
    return
  }

  const slide = parseUrl(url, placeholderBaseUrl)?.searchParams.get('slide') ?? undefined

  return composeEmbed(deckId, { slide, title: attr(element, 'title') })
}

export const speakerdeckIframeEmbedResolver = createUrlEmbedResolver(
  speakerdeckHosts,
  speakerdeckResolveEmbed,
)

export const speakerdeckFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'null' },
]
