import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'

const secretRegex = /\?secret=(?<secret>[A-Za-z0-9]+)/gi

const readFrameSecrets = (frame: Element): Array<string> => {
  const secrets = [...(attr(frame, 'src') ?? '').matchAll(secretRegex)].map((match) => {
    return match.groups?.secret ?? ''
  })
  const dataSecret = attr(frame, 'data-secret')

  if (dataSecret) {
    secrets.push(dataSecret)
  }

  return secrets
}

// WordPress 4.4 wrote the pair with no secret, and some hosts drop the blockquote's. Such a frame
// sits after its blockquote or first in the paragraph after it.
const findPrecedingBlockquote = (frame: Element): Element | undefined => {
  const parent = frame.parentElement
  const candidates = [frame.previousElementSibling]

  if (parent?.tagName === 'P' && parent.querySelector(':scope > iframe') === frame) {
    candidates.push(parent.previousElementSibling)
  }

  for (const candidate of candidates) {
    if (candidate?.matches('blockquote.wp-embedded-content')) {
      return candidate
    }
  }
}

const isEmptyWrapper = (element: Element): boolean => {
  return !element.children.length && !element.textContent?.trim()
}

// WordPress writes a post embed as a blockquote, which a cite resolver converts, and a frame
// rendering the same post, paired by a shared secret. wpautop and plugins wrap the frame in a
// paragraph, a div, a span or a noscript, so the frame is found by its secret.
export const stripWordpressEmbedFrames: DomTransform = (context) => {
  const citeResolvers = context.widgetResolvers.filter((resolver) => resolver.kind === 'cite')

  const isCited = async (blockquote: Element): Promise<boolean> => {
    for (const resolver of citeResolvers) {
      if (blockquote.matches(resolver.selector) && (await resolver.extract(blockquote))) {
        return true
      }
    }

    return false
  }

  return async (document) => {
    const citedBlockquotes: Array<Element> = []

    // A blockquote whose link has no text yields no cite, and its frame is the only carrier.
    for (const blockquote of document.querySelectorAll('blockquote.wp-embedded-content')) {
      if (await isCited(blockquote)) {
        citedBlockquotes.push(blockquote)
      }
    }

    const citedSecrets = citedBlockquotes.map((blockquote) => attr(blockquote, 'data-secret'))

    for (const frame of document.querySelectorAll('iframe.wp-embedded-content')) {
      const frameSecrets = readFrameSecrets(frame)
      const isPairedBySecret = frameSecrets.some((secret) => citedSecrets.includes(secret))

      if (!isPairedBySecret) {
        const blockquote = findPrecedingBlockquote(frame)

        if (
          !blockquote ||
          attr(blockquote, 'data-secret') ||
          !citedBlockquotes.includes(blockquote)
        ) {
          continue
        }
      }

      let wrapper = frame.parentElement

      frame.remove()

      while (wrapper && isEmptyWrapper(wrapper)) {
        const parent = wrapper.parentElement

        wrapper.remove()
        wrapper = parent
      }
    }
  }
}
