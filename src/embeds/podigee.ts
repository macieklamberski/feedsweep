import { getPathSegments, isAnyOf, isPlainObject, isString, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest, readPixels } from '../utils/hints.js'
import { placeholderBaseUrl, repairUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'podigee'

const hosts = ['podigee.io']

// A show is a subdomain of podigee.io, and `www.podigee.io` is the company site, whose paths can
// open with a number.
const showHostRegex = /^(?!www\.)[a-z0-9-]+\.podigee\.io$/i

// An episode is numbered, behind a letter on a trailer such as `t97-`, which separates it from
// the two other paths a show serves: `/feed` and the show root. A url already ending in `/embed`
// names the player outright and needs no such guess.
const safeEpisodeRegex = /^[a-z]?\d+-/

const sizes = {
  // Fluid in width and fixed in height: 145 at 400 and 900 pixels wide (2026-09-05), matching
  // the 144.8 the player reports once rendered.
  player: { height: 145 },
}

// The show is the subdomain and the episode the first path segment, which together make a
// stable id without parsing the query. The player url is the one Podigee's embed code writes.
// A show's own `/embed`, with no episode, plays its latest one and is keyed `{show}/embed`.
const composeEmbed = (parsed: URL, episode?: string): EmbedResolverResult => {
  const show = parsed.hostname.split('.')[0]
  const path = episode ? `${episode}/embed` : 'embed'

  return {
    provider,
    id: `${show}/${episode ?? 'embed'}`,
    src: `https://${parsed.hostname}/${path}?context=external`,
    url: `https://${parsed.hostname}/${episode ?? ''}`,
    ...sizes.player,
  }
}

// Podigee's loader script names the player url in data-configuration, and a reader never runs it.
// The rest name a global on the embedding page, `data-configuration="podigee"`, so nothing in
// the markup holds the data and those keep the generic treatment.
export const podigeeScriptEmbedResolver = createMarkupEmbedResolver(
  'script.podigee-podcast-player[data-configuration]',
  (element) => {
    // The inline spellings, data-configuration="podigee" or "playerConfiguration", are not urls,
    // so they resolve against the placeholder host and fail the show host shape. The repair is
    // the one every carrier url gets: a glued query fixed and whitespace trimmed off each value.
    const configuration = repairUrl(attr(element, 'data-configuration') ?? '')
    const parsed = parseUrl(configuration, placeholderBaseUrl)

    if (!parsed) {
      return
    }

    return podigeeResolveEmbed(parsed, element)
  },
)

export const podigeeResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!showHostRegex.test(url.hostname)) {
    return
  }

  const [episode, ...rest] = getPathSegments(url)

  if (!episode) {
    return
  }

  // A show's own `/embed` answers 302 to the player for a real show and 404 for an invented one.
  if (isAnyOf(episode, 'embed') && !rest.length) {
    return composeEmbed(url)
  }

  // With anything after `embed` the show serves its website page.
  if (isAnyOf(rest[0], 'embed') && rest.length === 1) {
    return composeEmbed(url, episode)
  }

  // {episode}/embed answers 302 to player.podigee-cdn.net/podcast-player/podigee-podcast-player
  // .html for a real episode and 404 for an invented one.
  if (!safeEpisodeRegex.test(episode)) {
    return
  }

  return composeEmbed(url, episode)
}

// An iframe framing a Podigee episode page rather than the player, so the reader gets an article.
export const podigeeIframeEmbedResolver = createUrlEmbedResolver(hosts, podigeeResolveEmbed)

// The player reports its height under a configurePlayer message serialised to a JSON string, 0
// before it has rendered and the real value after.
export const readPodigeeHeight = (data: unknown): number | undefined => {
  if (!isString(data)) {
    return
  }

  try {
    const message: unknown = JSON.parse(data)

    if (isPlainObject(message) && message.listenTo === 'configurePlayer') {
      return readPixels(message.height)
    }
  } catch {}
}

// The player takes no query to start and speaks player.js, and Podigee's help says playback waits
// for a click.
export const podigeeRenderHint: EmbedRenderHint = {
  provider,
  // Spelled out: every show's `/embed` 302s to the player on this host, so its messages come
  // from here.
  origin: 'https://player.podigee-cdn.net',
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
  readHeight: readPodigeeHeight,
}
