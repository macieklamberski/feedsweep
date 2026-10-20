import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const typeformHosts = ['typeform.com']

// A form id in a url path is alphanumeric (`MTt3Pw7K`). The enclosure probe offers every file on a
// Typeform host to this resolver, so the alphabet is what tells a form from a file such as
// `/to/MTt3Pw7K.mp3`.
const formIdRegex = /^[A-Za-z0-9]+$/

// The share panel writes the form's own title into an iframe-props string, `title=<the
// title>,<other props>`, which is the only human-readable text the empty div carries.
const titlePropRegex = /(?:^|,)title=([^,]+)/

// Four of the five embed types are launchers: a button that opens the form in an overlay.
// Those are chrome that was never article content, and each carries the same id as the
// widget, so they have to be excluded before the id is read.
const launcherAttributes = ['data-tf-popup', 'data-tf-slider', 'data-tf-popover', 'data-tf-sidetab']

const composeEmbed = (id: string, title?: string): EmbedResolverResult => {
  const result: EmbedResolverResult = {
    provider: 'typeform',
    id,
    src: `https://form.typeform.com/to/${encodePathSegment(id)}`,
    url: `https://form.typeform.com/to/${encodePathSegment(id)}`,
    height: 500,
  }

  return title ? { ...result, title } : result
}

// A live id is not a form id, and only Typeform's `single-embed` api maps one to the other, so the
// placeholder names the embed for enrichment and carries no player. `data-tf-region` picks the
// api host, so it leads the id.
const composeLiveEmbed = (
  liveId: string,
  element: Element,
  title?: string,
): EmbedResolverResult => {
  const region = attr(element, 'data-tf-region')
  const result: EmbedResolverResult = {
    provider: 'typeform',
    id: region ? `${region}/${liveId}` : liveId,
  }

  return title ? { ...result, title } : result
}

const readTitle = (element: Element): string | undefined => {
  return attr(element, 'data-tf-iframe-props')?.match(titlePropRegex)?.[1]?.trim() || undefined
}

// Typeform's inline embed is an empty div only the SDK hydrates into an iframe.
// Both generations do this, the current `data-tf-*` family and the `typeform-widget` class whose
// loader is still served.
export const typeformWidgetEmbedResolver = createMarkupEmbedResolver(
  'div[data-tf-widget], div[data-tf-live], div.typeform-widget[data-url]',
  (element) => {
    if (launcherAttributes.some((name) => element.hasAttribute(name))) {
      return
    }

    const title = readTitle(element)
    const widgetId = attr(element, 'data-tf-widget')

    if (widgetId) {
      return composeEmbed(widgetId, title)
    }

    const liveId = attr(element, 'data-tf-live')

    if (liveId) {
      return composeLiveEmbed(liveId, element, title)
    }

    return typeformResolveEmbed(attr(element, 'data-url') ?? '')
  },
)

// `form.typeform.com/to/<id>` is what the platform's oEmbed emits, and the per-account
// `<user>.typeform.com/to/<id>` still serves the same form without redirecting, so both
// reach here. The query is telemetry (`typeform-embed`, `typeform-medium`) and is dropped.
export const typeformResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, typeformHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  return segments[0] === 'to' && segments[1] && formIdRegex.test(segments[1])
    ? composeEmbed(segments[1], attr(element, 'title'))
    : undefined
}

// A Typeform form iframe, on form.typeform.com or a per-account subdomain.
export const typeformIframeEmbedResolver = createUrlEmbedResolver(
  typeformHosts,
  typeformResolveEmbed,
)
