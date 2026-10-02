import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'googleforms'

const formHeight = 600

const shortLinkHost = 'forms.gle'

// A form reads every `entry.{question}` pair off its own query as a prefilled answer.
const isPrefillParam = (name: string): boolean => {
  return name.startsWith('entry.')
}

// A short code is resolved to a form id only by its redirect, so the short link is the frame.
const composeShortLink = (url: URL, element?: Element): EmbedResolverResult | undefined => {
  const segments = getPathSegments(url)
  const code = segments[0]

  if (segments.length !== 1) {
    return
  }

  return {
    provider,
    id: code,
    src: `https://forms.gle/${code}`,
    url: `https://forms.gle/${code}`,
    height: formHeight,
    title: attr(element, 'title'),
  }
}

// `/forms/d/e/{id}` names a form by its published id and `/forms/d/{id}` by its Drive file id,
// which the server redirects to the published id. The Workspace prefix `/a/{domain}/` and the
// account prefix `/u/{n}/` only pick the sign-in and serve the same form.
export const googleformsResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  if (isHostOf(url, [shortLinkHost])) {
    return composeShortLink(parsed, element)
  }

  const pathSegments = getPathSegments(parsed)
  const segments = pathSegments[0] === 'a' ? pathSegments.slice(2) : pathSegments
  const formSegments = segments[1] === 'u' ? segments.slice(3) : segments.slice(1)

  if (segments[0] !== 'forms' || formSegments[0] !== 'd') {
    return
  }

  const isPublished = formSegments[1] === 'e'
  const formId = formSegments[isPublished ? 2 : 1]
  const routeIndex = isPublished ? 3 : 2

  if (formSegments[routeIndex] !== 'viewform' || formSegments.length > routeIndex + 1) {
    return
  }

  const formPath = isPublished ? `e/${formId}` : formId
  const prefill = filterUrlQuery(parsed, isPrefillParam).replace('?', '&')

  return {
    provider,
    id: formId,
    src: `https://docs.google.com/forms/d/${formPath}/viewform?embedded=true${prefill}`,
    url: `https://docs.google.com/forms/d/${formPath}/viewform`,
    height: formHeight,
    title: attr(element, 'title'),
  }
}

export const googleformsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com', shortLinkHost],
  googleformsResolveEmbed,
)

export const googleformsFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Embedded Document' }, // Embed Any Document plugin
]
