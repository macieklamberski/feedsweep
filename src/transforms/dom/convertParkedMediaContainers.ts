import type { DomTransform, MediaResolverResult, ScopedAttribute } from '../../types.js'
import { attr, isInScope, playableElements } from '../../utils/dom.js'
import { prepareUrl } from '../../utils/urls.js'
import { createMediaElement, getMediaTag } from '../../utils/widgets.js'

const playableSelector = playableElements.join(', ')

const findParkedMedia = (
  element: Element,
  entries: Array<ScopedAttribute>,
): MediaResolverResult | undefined => {
  for (const entry of entries) {
    if (!isInScope(element, entry)) {
      continue
    }

    const value = attr(element, entry.attribute)

    if (!value) {
      continue
    }

    const tag = getMediaTag(value)

    if (tag) {
      return { tag, src: value }
    }
  }
}

// A Discourse video placeholder, a Beaver Builder row background, the Drupal audio field and
// several WordPress audio players park the media url in an attribute for JS to build the player.
export const convertParkedMediaContainers: DomTransform = (context) => {
  const { mediaSrcAttributes } = context

  return (document) => {
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

      // An unresolved url is kept, unlike in convertWidgets: dropping it takes the media out of the
      // item, since no browser reads a data-* url and the container renders nothing on its own.
      const src = prepareUrl(parked.src, context)

      // The container often holds a caption or a track title beside the parked url.
      element.prepend(createMediaElement(document, { tag: parked.tag, src }))
    }
  }
}
