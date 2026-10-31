import { encodePathSegment, isPresent } from 'trousse'
import { composeEmbedUrl, readSrcMediaId } from '../../embeds/wistia.js'
import type { DomTransform, TransformContext } from '../../types.js'
import { attr, parseRatio } from '../../utils/dom.js'
import { createIframe, readCleanedCarrierUrl } from '../../utils/widgets.js'

// Pulls the hashed id out of the `wistia_async_{id}` class the facade carries, up to the end of
// the class token.
const wistiaIdRegex = /\bwistia_async_(\S+)/
// Pulls the id out of the `wistia_{id}` id the legacy API embed's mount div carries.
const legacyIdRegex = /^wistia_(.+)/

// The facade states its kind in a second class token beside the id. A channel is its own player,
// so the media route built from a channel id names no media.
const channelFacadeRegex = /\bwistia_channel\b/

// The wistia_async_{id} div is the JS-API inline embed and <wistia-player media-id> the current
// form. A bare medias/{id}.jsonp script remains when a feed keeps the loader but drops the div.
// Dropping the iframe arm lets a loader script beside a real iframe mint a second player.
const wistiaSelector = [
  '[class*="wistia_async_"]',
  // The legacy API embed: a mount div that `Wistia.embed()` fills, empty or holding a Flash
  // fallback. Wistia's script marks a filled div `wistia_embed_initialized`, and that div keeps
  // its poster. A plugin writes the same mount with its own `wistia-video` class.
  'div.wistia_embed[id^="wistia_"]:not(.wistia_embed_initialized)',
  'div.wistia-video[id^="wistia_"]',
  'wistia-player[media-id]',
  'script[src*="/embed/medias/" i]',
  'iframe[src]',
].join(', ')

// A src path is already a segment. An attribute comes out decoded, and its id goes into a path.
const readMediaId = (element: Element, context: TransformContext): string | undefined => {
  if (element.localName === 'wistia-player') {
    return encodePathSegment(attr(element, 'media-id') ?? '')
  }

  // A script or a frame carries the media id in its src path, and `readSrcMediaId` checks the host.
  if (element.localName === 'iframe') {
    return readSrcMediaId(readCleanedCarrierUrl(element, context))
  }

  if (element.localName === 'script') {
    return readSrcMediaId(attr(element, 'src'))
  }

  const asyncId = element.className.match(wistiaIdRegex)?.[1]

  if (asyncId) {
    return encodePathSegment(asyncId)
  }

  return encodePathSegment(element.id.match(legacyIdRegex)?.[1] ?? '')
}

// Wistia's async div, legacy API div, <wistia-player> element and loader script all render
// nothing without JS, and the legacy div's Flash fallback needs a plugin no browser ships.
// Wistia's poster needs the media JSON hop, so none of them states a thumbnail.
export const rebuildWistiaEmbeds: DomTransform = (context) => (document) => {
  const elements = Array.from(document.querySelectorAll(wistiaSelector))

  // An id already carried by a div, a custom element or a real iframe. Collected before any
  // rebuilding because document order does not put the script last. Wistia serves one media
  // under any case of its id, so a loader script still matches a carrier spelling it in capitals.
  const carried = new Set(
    elements
      .filter((element) => element.localName !== 'script')
      .map((element) => readMediaId(element, context)?.toLowerCase())
      .filter(isPresent),
  )

  for (const element of elements) {
    if (element.localName === 'iframe') {
      continue
    }

    const mediaId = readMediaId(element, context)

    if (!mediaId) {
      continue
    }

    if (element.localName === 'script' && carried.has(mediaId.toLowerCase())) {
      continue
    }

    const route = channelFacadeRegex.test(element.className ?? '') ? 'channel' : 'iframe'
    const iframe = createIframe(document, composeEmbedUrl(route, mediaId))

    // The custom element's aspect is a bare decimal.
    const ratio = parseRatio(attr(element, 'aspect') ?? '')

    // Written as the CSS property it is, not as width and height attributes: the facade states
    // a shape and never a size, and the widget pass reads `aspect-ratio` off the rebuilt iframe
    // the same as it reads one off any responsive wrapper.
    if (ratio) {
      iframe.setAttribute('style', `aspect-ratio: ${ratio}`)
    }

    // Replace the outermost Wistia wrapper so the padding/sizing divs go with it. The
    // padding div is the outer of the two, so prefer it. Fall back to the wrapper, then
    // to the embed div when there is no responsive wrapper around it.
    const padding = element.closest('.wistia_responsive_padding')
    const wrapper = element.closest('.wistia_responsive_wrapper')
    const target = padding ?? wrapper ?? element

    target.replaceWith(iframe)
  }
}
