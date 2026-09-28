import { isNonEmptyString, isNumber } from 'trousse'
import type { DomTransform } from '../../types.js'
import { jsonAttr } from '../../utils/dom.js'
import { isUrlShaped } from '../../utils/urls.js'
import { createLink } from '../../utils/widgets.js'

type MentionAttrs = {
  name?: string
  id?: number
  url?: string | null
}

// Substack ships an @-mention as an empty span whose name lives only in its data-attrs JSON.
// A user mention carries url: null, and the profile url its id mints redirects to the handle.
export const fixSubstackMentions: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('span.mention-wrap')) {
    const attrs = jsonAttr<MentionAttrs>(element, 'data-attrs')

    if (!attrs || !isNonEmptyString(attrs.name)) {
      continue
    }

    let url: string | undefined

    // The id lands in a url template, so anything that is not the positive integer Substack
    // emits is dropped.
    if (isNonEmptyString(attrs.url) && isUrlShaped(attrs.url)) {
      url = attrs.url
    } else if (isNumber(attrs.id) && Number.isInteger(attrs.id) && attrs.id > 0) {
      url = `https://substack.com/profile/${attrs.id}`
    }

    if (url) {
      element.replaceWith(createLink(document, url, `@${attrs.name}`))
    } else {
      element.replaceWith(document.createTextNode(`@${attrs.name}`))
    }
  }
}
