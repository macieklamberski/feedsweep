import { isSoundcloudStream } from '../../embeds/soundcloud.js'
import type { DomTransform, WidgetResolver } from '../../types.js'
import { attr, isElement, isNonWhitespaceText } from '../../utils/dom.js'
import { cleanUnclaimedUrl, flashFileRegex, resolveOrDropUrl } from '../../utils/urls.js'
import {
  createCaptionedFigure,
  createEmbedPlaceholder,
  createIframe,
  createMediaElement,
  embedCarrierSelector,
  getEmbedSize,
  getMediaTag,
  isEmbedOrMediaResolver,
  isMediaResult,
  isResolvedIframe,
  prepareEmbedMetadata,
  prepareMediaMetadata,
  readCarrierUrl,
  readPlayer,
  resolveEmbedProbe,
  toPlayerKey,
} from '../../utils/widgets.js'

type PageMedia = {
  media: Element
  frame: Element
  player: string | undefined
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

    // A platform url serving every kind of file is sized by its kind, which the <audio> or <video>
    // tag names.
    const frame = createIframe(document, url)
    frame.setAttribute('type', `${media.localName}/*`)

    const embed = await resolveEmbedProbe(frame, resolvers)

    if (!embed) {
      return
    }

    found.push({ media, frame, player: toPlayerKey(embed) })
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

// Embed carriers as shipped: third-party iframes and dead Flash objects.
export const convertWidgets: DomTransform = (context) => {
  const { widgetResolvers } = context
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

    // Runs before the tiers below, which claim the frame it leaves.
    const pageMedia: Array<PageMedia> = []

    for (const media of document.querySelectorAll('audio, video')) {
      const found = await readPageMedia(media, embedOrMediaResolvers, document)

      if (found) {
        pageMedia.push(found)
      }
    }

    // A post that also frames the same video or file already plays it, so the dead element goes.
    const framedPlayers: Array<string> = []

    if (pageMedia.length) {
      for (const frame of document.querySelectorAll(embedCarrierSelector)) {
        const player = await readPlayer(frame, widgetResolvers)

        if (player) {
          framedPlayers.push(player)
        }
      }
    }

    for (const { media, frame, player } of pageMedia) {
      if (player && framedPlayers.includes(player)) {
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

          const prepared = prepareMediaMetadata({ ...metadata, src }, context)
          const mediaElement = createMediaElement(document, prepared)
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
      const cleaned = cleanUnclaimedUrl(resolved, context)

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
