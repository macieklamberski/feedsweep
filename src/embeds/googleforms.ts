import { getPathSegments, isAnyOf, isHostOf, startsWithAnyOf } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'
import { getPathSegmentsWithoutWorkspace } from './googledrive.js'

const provider = 'googleforms'

const sizes = {
  player: { height: 600 },
}

const shortLinkHosts = ['forms.gle']

// A form reads every `entry.{question}` pair off its own query as a prefilled answer.
const isPrefillParam = (name: string): boolean => {
  return startsWithAnyOf(name, ['entry.'])
}

// A short code is resolved to a form id only by its redirect, so the short link is the frame.
const composeShortLink = (url: URL, element?: Element): EmbedResolverResult | undefined => {
  const segments = getPathSegments(url)
  const [code] = segments

  if (segments.length !== 1) {
    return
  }

  return {
    provider,
    id: code,
    src: `https://forms.gle/${code}`,
    url: `https://forms.gle/${code}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

// `/forms/d/e/{id}` names a form by its published id and `/forms/d/{id}` by its Drive file id,
// which the server redirects to the published id. The account prefix `/u/{n}/` only picks the
// sign-in and serves the same form.
export const googleformsResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (isHostOf(url, shortLinkHosts)) {
    return composeShortLink(url, element)
  }

  const [app, accountOrRoute, ...rest] = getPathSegmentsWithoutWorkspace(url)
  const formSegments = isAnyOf(accountOrRoute, 'u') ? rest.slice(1) : [accountOrRoute, ...rest]
  const [formsRoute, publishedOrId] = formSegments

  if (!isAnyOf(app, 'forms') || !isAnyOf(formsRoute, 'd')) {
    return
  }

  const isPublished = isAnyOf(publishedOrId, 'e')
  const [formId, route, ...trailing] = formSegments.slice(isPublished ? 2 : 1)

  if (!isAnyOf(route, 'viewform') || trailing.length > 0) {
    return
  }

  const formPath = isPublished ? `e/${formId}` : formId
  const prefill = filterUrlQuery(url, isPrefillParam).replace('?', '&')

  return {
    provider,
    id: formId,
    src: `https://docs.google.com/forms/d/${formPath}/viewform?embedded=true${prefill}`,
    url: `https://docs.google.com/forms/d/${formPath}/viewform`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const googleformsEmbedResolver = createUrlEmbedResolver(
  ['docs.google.com', ...shortLinkHosts],
  googleformsResolveEmbed,
)

export const googleformsFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Embedded Document' }, // Embed Any Document plugin
]
