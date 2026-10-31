import { decodeSegment } from 'trousse'
import type { DomTransform } from '../../types.js'
import { setInnerHtml } from '../../utils/dom.js'
import { isUrlShaped } from '../../utils/urls.js'
import { createLink, readPlayer } from '../../utils/widgets.js'

// Matching a relative path too would take `class` and `style` values for addresses.
const statedUrlRegex = /^(?:https?:)?\/\//i

// Which attribute carries the embed's address differs per platform.
const hasStatedUrl = (holder: Element): boolean => {
  for (const element of holder.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      if (statedUrlRegex.test(attribute.value)) {
        return true
      }
    }
  }

  return false
}

// Borlabs Cookie unblocks with `b64DecodeToUnicode`, which reads the base64 bytes as UTF-8.
const decodeBase64 = (value: string): string | undefined => {
  try {
    const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {}
}

const parkedCarriers = [
  // A lazy loader's load-later div, which holds the embed percent-encoded and renders nothing
  // itself.
  {
    selector: 'div.load-later[data-content]',
    attribute: 'data-content',
    decode: decodeSegment,
    hasOwnContent: false,
  },

  // Borlabs Cookie's content blocker, which shows a consent notice in place of the embed and
  // holds the embed base64-encoded.
  {
    selector: '[data-borlabs-cookie-content]',
    attribute: 'data-borlabs-cookie-content',
    decode: decodeBase64,
    hasOwnContent: false,
  },

  // Squarespace's video block wrapper, which holds the player iframe entity-encoded until
  // Squarespace's script draws it. A wrapper the feed left unclosed holds the rest of the post.
  // A copy of the block with its classes stripped keeps only the two attributes. The parser has
  // already decoded the entities, which are the only encoding the payload carries.
  {
    selector: '.sqs-video-wrapper[data-html], div[data-provider-name][data-html]',
    attribute: 'data-html',
    hasOwnContent: true,
  },
]

// A container that holds an embed encoded in an attribute and renders something else, or nothing.
export const surfaceParkedMarkup: DomTransform = (context) => async (document) => {
  for (const { selector, attribute, decode, hasOwnContent } of parkedCarriers) {
    for (const container of document.querySelectorAll(selector)) {
      // A wrapper that already holds the player Squarespace drew keeps it.
      if (hasOwnContent && container.querySelector('iframe')) {
        continue
      }

      // The payload is the complete original element: the YouTube iframe or the tweet blockquote.
      const encoded = container.getAttribute(attribute)

      if (!encoded) {
        continue
      }

      const markup = decode ? decode(encoded) : encoded

      if (markup === undefined) {
        continue
      }

      const holder = document.createElement('div')
      // The decoded string still carries HTML entities in its attribute values.
      setInnerHtml(holder, markup)

      // A load-later container states the embed's address as well as its markup. When the parked
      // element was itself stripped of every link, that address is the only thing left to reach the
      // post by.
      const url = container.getAttribute('data-url')

      if (url && isUrlShaped(url) && !hasStatedUrl(holder)) {
        holder.appendChild(createLink(document, url))
      }

      if (!hasOwnContent) {
        container.replaceWith(...Array.from(holder.childNodes))

        continue
      }

      // A site moved off Squarespace often embeds the same video again beside the dead block.
      const playedElsewhere: Array<string> = []

      for (const frame of document.querySelectorAll('iframe')) {
        const player = await readPlayer(frame, context.widgetResolvers, context)

        if (player) {
          playedElsewhere.push(player)
        }
      }

      // A payload the feed escaped twice parses to text, which would show as markup.
      const frames: Array<Element> = []

      for (const frame of holder.querySelectorAll('iframe')) {
        const player = await readPlayer(frame, context.widgetResolvers, context)

        if (player && playedElsewhere.includes(player)) {
          continue
        }

        frames.push(frame)
      }

      if (frames.length === 0) {
        continue
      }

      container.removeAttribute(attribute)
      container.before(...frames)
    }
  }
}
