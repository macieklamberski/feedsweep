import type { DomTransform } from '../../types.js'
import { attr, isElement, isSkippable, isText } from '../../utils/dom.js'
import { absoluteUrlRegex } from '../../utils/urls.js'
import { createLink } from '../../utils/widgets.js'

const gistScriptRegex = /gist\.github\.com\/(?:([^/?"]+)\/)?([^/?"#]+)\.js/
const jsonSuffixRegex = /\.json$/

const gistMountSelectors = [
  'div.gistLoad[data-id]', // gist-Blogger
  'code[data-gist-id]', // gist-embed
  'div[data-gist-id]', // gist-embed
  'div[data-gist]', // gist-oembed, Laravel Playground, Stargazer
]

const gistMountSelector = gistMountSelectors.join(', ')

const gistCarrierSelector = [
  'script[src*="gist.github.com"]',
  'amp-gist[data-gistid]',
  ...gistMountSelectors,
].join(', ')

const readGistPath = (element: Element): string | undefined => {
  // <amp-gist> names the gist by id alone, with no owner. `gist.github.com/{id}` redirects to
  // the owned URL, so the bare id makes the same link the script form does.
  if (element.localName === 'amp-gist') {
    return element.getAttribute('data-gistid') || undefined
  }

  if (element.matches(gistMountSelector)) {
    const value =
      attr(element, 'data-gist-id') ?? attr(element, 'data-id') ?? attr(element, 'data-gist')

    // One site's own loader writes the whole gist url here, and only an id composes a link.
    if (!value || absoluteUrlRegex.test(value)) {
      return
    }

    // gist-oembed writes the path of the gist's .json endpoint.
    return value.replace(jsonSuffixRegex, '')
  }

  const match = element.getAttribute('src')?.match(gistScriptRegex)

  if (!match) {
    return
  }

  return match[1] ? `${match[1]}/${match[2]}` : match[2]
}

// The loader overwrites its mount, which holds a placeholder such as "Loading ....". Anything more
// is kept: a <pre> fallback with the code, a gist <script> of its own, or the rest of the post
// swallowed by a mount the feed left unclosed.
const isPlaceholderMount = (element: Element): boolean => {
  let hasTextRun = false

  for (const node of element.childNodes) {
    if (isSkippable(node)) {
      continue
    }

    if (isElement(node) && node.localName === 'script' && !readGistPath(node)) {
      continue
    }

    if (isText(node) && !hasTextRun) {
      hasTextRun = true
      continue
    }

    return false
  }

  return true
}

// A Gist embeds as a gist.github.com <script>, an <amp-gist>, or the mount a gist loader
// fills: gist-Blogger's `div.gistLoad[data-id]` and gist-embed's `[data-gist-id]`. None renders
// without JS. A bare id makes a working link, since gist.github.com/{id} redirects to the owner.
export const linkifyGistEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll(gistCarrierSelector)) {
    if (element.matches(gistMountSelector) && !isPlaceholderMount(element)) {
      continue
    }

    const path = readGistPath(element)

    if (!path) {
      continue
    }

    const url = `https://gist.github.com/${path}`

    element.replaceWith(createLink(document, url))
  }
}
