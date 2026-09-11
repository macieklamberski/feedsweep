import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'jotform'

const jotformHosts = ['form.jotform.com']

const safeFormIdRegex = /^\d+$/
const loaderPathRegex = /^\/jsform\/(\d+)$/

// The query is dropped. Jotform prefills a field from any parameter named after it, so there is
// no list that tells a prefill from a tracking parameter, and passing the whole query through
// would carry the second along with the first.
const composeEmbed = (formId: string): EmbedResolverResult => {
  return {
    provider,
    id: formId,
    src: `https://form.jotform.com/${formId}`,
    url: `https://form.jotform.com/${formId}`,
  }
}

// The form frame, which the platform serves at the bare id and at `/form/{id}` alike.
export const jotformResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const route = segments[0] === 'form' ? segments.slice(1) : segments
  const formId = route[0]

  if (route.length !== 1 || !formId || !safeFormIdRegex.test(formId)) {
    return
  }

  return composeEmbed(formId)
}

// Jotform's inline form, written in place by a script the pipeline drops, so an item whose whole
// body is the form renders empty. The launcher button on `static/feedback2.js` is not this: it
// opens the form in an overlay, which is chrome and not the item's content.
export const jotformScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="form.jotform.com/jsform/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), jotformHosts)
    const formId = loader?.pathname.match(loaderPathRegex)?.[1]

    return formId ? composeEmbed(formId) : undefined
  },
)

export const jotformIframeEmbedResolver = createUrlEmbedResolver(jotformHosts, jotformResolveEmbed)
