import { isSoundcloudStream } from '../../embeds/soundcloud.js'
import type {
  DomTransform,
  EmbedResolverResult,
  MediaResolverResult,
  WidgetResolver,
} from '../../types.js'
import { attr, isElement, isNonWhitespaceText, playableElements } from '../../utils/dom.js'
import {
  audioFileRegex,
  cleanUrl,
  flashFileRegex,
  isMediaWikiFilePage,
  resolveOrDropUrl,
  resolveOrKeepUrl,
  videoFileRegex,
} from '../../utils/urls.js'
import {
  createCaptionedFigure,
  createEmbedPlaceholder,
  createIframe,
  createMediaElement,
  embedCarrierSelector,
  getEmbedSize,
  isEmbedOrMediaResolver,
  isMediaResult,
  isResolvedIframe,
  prepareEmbedMetadata,
  readCarrierUrl,
  resolveEmbedProbe,
} from '../../utils/widgets.js'

const playableSelector = playableElements.join(', ')

const getMediaTag = (url: string): MediaResolverResult['tag'] | undefined => {
  if (isMediaWikiFilePage(url)) {
    return
  }

  if (videoFileRegex.test(url)) {
    return 'video'
  }

  if (audioFileRegex.test(url)) {
    return 'audio'
  }
}

// A Discourse video placeholder, a Beaver Builder row background, the Drupal audio field and
// several WordPress audio players park the media url in an attribute for JS to build the player.
const findParkedMedia = (
  element: Element,
  attributes: Array<string>,
): MediaResolverResult | undefined => {
  for (const attribute of attributes) {
    const value = attr(element, attribute)

    if (!value) {
      continue
    }

    const tag = getMediaTag(value)

    if (tag) {
      return { tag, src: value }
    }
  }
}

type PageMedia = {
  media: Element
  frame: Element
  embed: EmbedResolverResult
}

// A WordPress video shortcode or a hand-written <video> or <audio> can name a platform's page,
// which no browser plays. Answers that page when a resolver claims every url the element names,
// so an element that also names a real file keeps playing it.
const readPageMedia = async (
  media: Element,
  resolvers: ReadonlyArray<WidgetResolver>,
  document: Document,
): Promise<PageMedia | undefined> => {
  const found: Array<PageMedia> = []

  for (const element of [media, ...media.querySelectorAll('source')]) {
    const url = attr(element, 'src')

    if (!url) {
      continue
    }

    // Vimeo's `progressive_redirect` file sits on a host its resolver claims, and plays in the
    // element as written. A SoundCloud feed stream names its track, which the widget plays.
    if (getMediaTag(url) && !isSoundcloudStream(url)) {
      return
    }

    // A platform url serving every kind of file is sized by its kind: a <source> states it in
    // `type`, and otherwise the <audio> or <video> tag names it.
    const frame = createIframe(document, url)
    frame.setAttribute('type', attr(element, 'type') ?? `${media.localName}/*`)

    const embed = await resolveEmbedProbe(frame, resolvers)

    if (!embed) {
      return
    }

    found.push({ media, frame, embed })
  }

  // A resolver that claims the element itself reads it in the tiers below. The copy keeps a
  // resolver from removing companion markup while it is asked.
  const copy = media.cloneNode(true) as Element

  for (const element of [copy, ...copy.querySelectorAll('source')]) {
    if (await isResolvedIframe(element, resolvers)) {
      return
    }
  }

  return found[0]
}

const shellTags = ['param', 'br']

// What a Flash <object> holds besides its carrier that renders nothing: <param>s, <br>s,
// whitespace, and a wrapper such as a <p> holding only those or the carrier. A link around the
// carrier, or an empty element such as the placeholder an earlier carrier became, is content.
const isShellMarkup = (node: Node, carrier: Element): boolean => {
  if (node === carrier) {
    return true
  }

  if (!isElement(node)) {
    return !isNonWhitespaceText(node)
  }

  if (shellTags.includes(node.localName)) {
    return true
  }

  if (node.localName === 'a') {
    return false
  }

  const children = Array.from(node.childNodes)

  return children.length > 0 && children.every((child) => isShellMarkup(child, carrier))
}

const carrierOrShell = (element: Element): Element => {
  const shell = element.parentElement?.closest('object')

  if (!shell || !isShellMarkup(shell, element)) {
    return element
  }

  return shell
}

// Ghost's video card already lands inside a figure carrying the author's own caption, which is
// the case the ancestor check leaves alone.
const captionMedia = (
  document: Document,
  media: HTMLElement,
  target: Element,
  title: string | undefined,
): Element => {
  const text = title?.trim()

  if (!text || target.parentElement?.closest('figure')) {
    return media
  }

  return createCaptionedFigure(document, media, text)
}

// Embed carriers as shipped: third-party iframes, dead Flash objects, media urls parked in data-*.
export const convertWidgets: DomTransform = (context) => {
  const { widgetResolvers, mediaSrcAttributes } = context
  const embedOrMediaResolvers = widgetResolvers.filter(isEmbedOrMediaResolver)

  return async (document) => {
    const queried = new Map<string, Array<Element>>()

    const elementsFor = (selector: string): Array<Element> => {
      const cached = queried.get(selector)

      if (cached) {
        return cached
      }

      const found = Array.from(document.querySelectorAll(selector))
      queried.set(selector, found)

      return found
    }

    // Runs before the tiers below, which replace the iframes the playable guard relies on.
    for (const element of document.querySelectorAll('div, figure, span, li')) {
      const parked = findParkedMedia(element, mediaSrcAttributes)

      if (!parked) {
        continue
      }

      // A container that already wraps something playable is chrome around a real player,
      // and the attribute belongs to that player, not to a missing element.
      if (element.querySelector(playableSelector)) {
        continue
      }

      // resolveOrKeepUrl, unlike the tiers below: dropping the url takes the media out of the item,
      // since no browser reads a data-* url and the container renders nothing on its own.
      const resolved = resolveOrKeepUrl(parked.src, context)
      const cleaned = cleanUrl(resolved, context)

      // The container often holds a caption or a track title beside the parked url.
      element.prepend(createMediaElement(document, { tag: parked.tag, src: cleaned }))
    }

    // Runs before the tiers below, which claim the frame it leaves.
    const pageMedia: Array<PageMedia> = []

    for (const media of document.querySelectorAll('audio, video')) {
      const found = await readPageMedia(media, embedOrMediaResolvers, document)

      if (found) {
        pageMedia.push(found)
      }
    }

    // A post that also frames the same video or file already plays it, so the dead element goes.
    const framedKeys = new Set<string>()

    if (pageMedia.length) {
      for (const frame of document.querySelectorAll(embedCarrierSelector)) {
        const embed = await resolveEmbedProbe(frame.cloneNode(true) as Element, widgetResolvers)

        if (embed) {
          framedKeys.add(`${embed.provider}/${embed.id}`)
        }
      }
    }

    for (const { media, frame, embed } of pageMedia) {
      if (framedKeys.has(`${embed.provider}/${embed.id}`)) {
        media.remove()
        continue
      }

      const poster = attr(media, 'poster')

      if (poster) {
        frame.setAttribute('data-thumbnail', poster)
      }

      media.replaceWith(frame)
    }

    for (const resolver of embedOrMediaResolvers) {
      for (const element of elementsFor(resolver.selector)) {
        // Legacy Flash pairs an `<object>` with a nested `<embed>` and a url-keyed resolver
        // matches both. Replacing the outer one detaches the inner, which is still in this
        // snapshot.
        if (!element.parentNode) {
          continue
        }

        const metadata = await resolver.extract(element)

        if (!metadata) {
          continue
        }

        const src = resolveOrDropUrl(metadata.src, context)

        if (isMediaResult(metadata)) {
          if (!src) {
            continue
          }

          const cleaned = cleanUrl(src, context)
          const poster = resolveOrKeepUrl(metadata.poster, context)
          const mediaElement = createMediaElement(document, { ...metadata, src: cleaned, poster })
          const target = carrierOrShell(element)

          target.replaceWith(captionMedia(document, mediaElement, target, metadata.title))
          continue
        }

        // A src that resolves to nothing drops the embed. No src at all names a player only a
        // fetch can find, which enrichment fills in from the provider and id.
        if (metadata.src ? !src : !metadata.id) {
          continue
        }

        const carriedThumbnail = attr(element, 'data-thumbnail')

        const prepared = prepareEmbedMetadata(
          { ...metadata, thumbnail: carriedThumbnail ?? metadata.thumbnail },
          context,
        )
        const placeholder = createEmbedPlaceholder(document, {
          ...prepared,
          src: prepared.src ?? src,
        })

        carrierOrShell(element).replaceWith(placeholder)
      }
    }

    // Whatever no resolver claimed. A resolver may have replaced an element that is still in
    // the snapshot, including the inner half of an <object>/<embed> pair, so a detached one
    // is already handled.
    for (const element of elementsFor(embedCarrierSelector)) {
      if (!element.parentNode) {
        continue
      }

      const src = readCarrierUrl(element)

      // resolveUrlFn rejects `about:blank`.
      const resolved = resolveOrDropUrl(src, context)
      // This src is the publisher's own URL, not one minted from a parsed id, so it arrives
      // with whatever tracking params they pasted.
      const cleaned = cleanUrl(resolved, context)

      if (!cleaned) {
        continue
      }

      // No browser runs a .swf since 2021. An <object> stays, since a browser then shows its
      // fallback children and a placeholder would drop them. A bare <embed> has none and goes.
      if (flashFileRegex.test(cleaned)) {
        if (element.localName === 'embed' && !element.closest('object')) {
          element.remove()
        }

        continue
      }

      // A carrier framing a bare media file plays as the element instead: the reader gets a
      // native player, and the src flows through the media passes downstream.
      const mediaTag = getMediaTag(cleaned)

      if (mediaTag) {
        const mediaElement = createMediaElement(document, { tag: mediaTag, src: cleaned })

        carrierOrShell(element).replaceWith(mediaElement)
        continue
      }

      const placeholder = createEmbedPlaceholder(document, {
        src: cleaned,
        ...getEmbedSize(element),
      })

      carrierOrShell(element).replaceWith(placeholder)
    }
  }
}
