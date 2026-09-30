import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, parseRatio } from '../utils/dom.js'
import { composeQuery, isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'speakerdeck'

// A few feeds fold the slide number into the id attribute itself.
const slideSuffixRegex = /\?slide=([^&]+)$/

// Speaker Deck's snippet always carries the ratio, and 16:9 is what decks mostly are.
const defaultDeckRatio = '16/9'

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
    const result = composeEmbed(deckId, { slide })

    // The script carries the deck's aspect ratio as a bare decimal, e.g. `data-ratio="1.33"`.
    const ratio = parseRatio(attr(element, 'data-ratio') ?? '') ?? defaultDeckRatio

    return { ...result, ratio }
  },
)

// The player iframe that script builds, saved into the feed by a CMS that ran the script first.
export const speakerdeckResolveEmbed: ResolveEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const deckId = segments[0] === 'player' ? segments[1] : undefined

  // Speaker Deck serves files on its own host, so a file name is an enclosure.
  if (!deckId || isFileName(deckId)) {
    return
  }

  const slide = parseUrl(url, placeholderBaseUrl)?.searchParams.get('slide') ?? undefined

  return {
    ...composeEmbed(deckId, { slide, title: attr(element, 'title') }),
    ratio: defaultDeckRatio,
  }
}

export const speakerdeckIframeEmbedResolver = createUrlEmbedResolver(
  ['speakerdeck.com'],
  speakerdeckResolveEmbed,
)

export const speakerdeckFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'null' },
]
