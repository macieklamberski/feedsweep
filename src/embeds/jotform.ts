import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { digitsRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'jotform'

// The page hosts only, matched exactly, since `files.jotform.com` and other subdomains of
// `jotform.com` serve uploads. Every regional and legacy host serves the same form ids.
const jotformHosts = [
  'form.jotform.co',
  'form.jotform.com',
  'form.jotform.me',
  'form.jotform.us',
  'form.jotformeu.com',
  'form.jotformpro.com',
  'form.jotformz.com',
  'italian.jotform.com',
  'jotform.com',
  'oembed.jotform.com',
  'pci.jotform.com',
  'www.jotform.com',
]

const loaderPathRegex = /^\/jsform\/([^/]+)$/

// The loader's starting box, which the iframe snippet also states. A card form starts at 640, and
// nothing in the markup tells a card form from a classic one.
const formHeight = 539

// Any name can be a prefill, which the form reads off its own query, so the query goes to the
// frame as the carrier sends it.
const composeEmbed = (formId: string, carrier: URL): EmbedResolverResult => {
  return {
    provider,
    id: formId,
    src: `https://form.jotform.com/${formId}${carrier.search}`,
    url: `https://form.jotform.com/${formId}`,
    height: formHeight,
  }
}

// The form frame, which the platform serves at the bare id and at `/form/{id}` alike.
export const jotformResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)

  if (!parsed || !isHostOf(parsed, jotformHosts)) {
    return
  }

  const segments = getPathSegments(parsed)
  const route = segments[0] === 'form' ? segments.slice(1) : segments
  const formId = route[0]

  if (route.length !== 1 || !formId || !digitsRegex.test(formId)) {
    return
  }

  return composeEmbed(formId, parsed)
}

// Jotform's inline form, written in place by a script the pipeline drops, so an item whose whole
// body is the form renders empty. The launcher button on `static/feedback2.js` is not this: it
// opens the form in an overlay, which is chrome and not the item's content.
export const jotformScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="jotform"][src*="/jsform/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), jotformHosts)
    const formId = loader?.pathname.match(loaderPathRegex)?.[1]

    if (!loader || !isHostOf(loader, jotformHosts) || !formId) {
      return
    }

    return composeEmbed(formId, loader)
  },
)

export const jotformIframeEmbedResolver = createUrlEmbedResolver(jotformHosts, jotformResolveEmbed)
