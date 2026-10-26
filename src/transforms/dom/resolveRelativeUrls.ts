import { stringifySrcset } from 'srcset'
import type { DomTransform, ResolveUrlFn } from '../../types.js'
import { svgHrefAttribute } from '../../utils/dom.js'
import { countSrcsetCandidates, parseSrcset } from '../../utils/images.js'
import {
  absoluteUrlRegex,
  collapseSlashRuns,
  resolveOrKeepUrl,
  urlAttributes,
} from '../../utils/urls.js'
import { paramObjectSelector } from '../../utils/widgets.js'

const hostPrefixedUrlRegex =
  /^(https?:)\/\/[^/?#]+(?:\/[^/?#]+)*?(?<!:|%3a)\/+(?=\/(?:[a-z0-9-]+\.)+[a-z]{2,}\/)/i
const hostPrefixedSrcTags = ['iframe', 'embed', 'script']

// Some sites join their own url onto a protocol-relative src as text, so the feed already holds
// `{scheme}//{site}//{host}/{path}`, sometimes with a third slash and sometimes behind the site's
// directory, `{site}/{dir}///{host}`, which the site does not serve. A run after `:` belongs to a
// url carried in the path, such as a web archive's, so it stays.
const stripSiteHostPrefix = (url: string): string => {
  return url.replace(hostPrefixedUrlRegex, '$1/')
}

// An absolute value other than a player or script src is left byte-identical, and a relative one
// with no `baseUrl` resolves to nothing and stays as written.
const resolveAttribute = (
  element: Element,
  attribute: string,
  baseUrl: string | undefined,
  resolveUrlFn: ResolveUrlFn,
): void => {
  const value = element.getAttribute(attribute)

  if (!value) {
    return
  }

  const resolved = resolveOrKeepUrl(value, { baseUrl, resolveUrlFn })

  if (attribute === 'src' && hostPrefixedSrcTags.includes(element.localName)) {
    const unprefixed = stripSiteHostPrefix(resolved)
    element.setAttribute(attribute, collapseSlashRuns(unprefixed))

    return
  }

  element.setAttribute(attribute, resolved)
}

const resolveSrcset = (
  element: Element,
  baseUrl: string | undefined,
  resolveUrlFn: ResolveUrlFn,
): void => {
  const srcset = element.getAttribute('srcset')

  if (!srcset) {
    return
  }

  const entries = parseSrcset(srcset)
  const hasRelative = entries.some((entry) => !absoluteUrlRegex.test(entry.url))
  const droppedCandidate = entries.length < countSrcsetCandidates(srcset)

  if (!hasRelative && !droppedCandidate) {
    return
  }

  const resolved = entries.map((entry) => ({
    ...entry,
    url: resolveUrlFn(entry.url, baseUrl) ?? entry.url,
  }))

  element.setAttribute('srcset', stringifySrcset(resolved))
}

type RelativeAttribute = {
  selector: string
  // The name to read, or how to pick it where the element decides.
  attribute: string | ((element: Element) => string)
  // `srcset` holds many urls and is rewritten even when none resolved, so it takes its own pass.
  srcset?: boolean
}

// Absolutising a fragment-only href breaks in-article scrolling: a cite names no scroll target.
const hrefTags = ['a', 'area']

// Every attribute the shared table names. A `src` row is read on any element below, and an href
// keeps its fragment-only exclusion.
const sharedAttributes: Array<RelativeAttribute> = urlAttributes
  .filter(({ attribute }) => attribute !== 'src')
  .map(({ tag, attribute }) => {
    const exclusion = tag && hrefTags.includes(tag) ? `:not([${attribute}^="#"])` : ''

    return { selector: `${tag ?? ''}[${attribute}]${exclusion}`, attribute }
  })

// What the shared table has no row for: a script's src read by the widget resolvers, a Flash
// player url in a param, a quote's source, a srcset list and an SVG link spelled either way.
const relativeAttributes: Array<RelativeAttribute> = [
  { selector: '[src]', attribute: 'src' },
  // The widget resolvers read the player such an object names here.
  { selector: `${paramObjectSelector} param[name="movie" i]`, attribute: 'value' },
  { selector: 'blockquote[cite], q[cite], ins[cite], del[cite]', attribute: 'cite' },
  { selector: 'image', attribute: svgHrefAttribute },
  { selector: 'img[srcset], source[srcset]', attribute: 'srcset', srcset: true },
  ...sharedAttributes,
]

// A relative or protocol-relative url points nowhere once the content leaves its page.
export const resolveRelativeUrls: DomTransform = ({ baseUrl, resolveUrlFn }) => {
  // Bailing out without a baseUrl leaves protocol-relative urls without a scheme.
  return (document) => {
    for (const { selector, attribute, srcset } of relativeAttributes) {
      for (const element of document.querySelectorAll(selector)) {
        if (srcset) {
          resolveSrcset(element, baseUrl, resolveUrlFn)

          continue
        }

        const name = typeof attribute === 'string' ? attribute : attribute(element)

        resolveAttribute(element, name, baseUrl, resolveUrlFn)
      }
    }
  }
}
