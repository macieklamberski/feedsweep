import { getQueryParam, type Nullish } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, jsonAttr } from '../../utils/dom.js'
import { isUrlShaped, parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe, createLink } from '../../utils/widgets.js'

const embedlyHosts = ['cdn.embedly.com']

const embedlyCarrierSelector = [
  'iframe[src*="cdn.embedly.com/widgets/media.html" i]',
  'div[data-type="embedly"]',
].join(', ')

type EmbedlyPayload = {
  type?: string
  url?: string
  thumbnail_url?: string
}

const isUsableUrl = (value: Nullish<string>): value is string => {
  return !!value && isUrlShaped(value)
}

const composeIframe = (document: Document, source: string, poster?: string): Element => {
  const iframe = createIframe(document, source)

  if (poster) {
    iframe.setAttribute('data-thumbnail', poster)
  }

  return iframe
}

// Embedly ships an embed as a wrapper iframe or as an empty div only the publishing client fills.
// Unwrapping the wrapper's url to the embed it holds is the caller's cleanUrlFn's, through
// urlpurify's embedProxyUnwrappers.
export const rebuildEmbedlyEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll(embedlyCarrierSelector)) {
    if (element.localName === 'iframe') {
      const params = parseUrlOnHosts(attr(element, 'src'), embedlyHosts)?.searchParams

      if (!params) {
        continue
      }

      // Embedly titles the wrapper for itself, such as `YouTube embed`, not for the item.
      element.removeAttribute('title')

      // The wrapper's query holds its poster as image, which the url the cleaner unwraps it to
      // does not carry.
      const poster = getQueryParam(params, 'image')

      if (isUsableUrl(poster)) {
        element.setAttribute('data-thumbnail', poster)
      }

      continue
    }

    // The div's data attribute carries an oEmbed payload.
    const payload = jsonAttr<EmbedlyPayload>(element, 'data')

    // A link payload, or one with no type, is a cite the cite pass claims.
    if (payload && (payload.type === undefined || payload.type === 'link')) {
      continue
    }

    if (payload && isUsableUrl(payload.url)) {
      const thumbnail = isUsableUrl(payload.thumbnail_url) ? payload.thumbnail_url : undefined
      const iframe = composeIframe(document, payload.url, thumbnail)

      element.replaceWith(iframe)
      continue
    }

    const source = attr(element, 'src')

    if (!payload && isUsableUrl(source)) {
      element.replaceWith(createLink(document, source))
    }
  }
}
