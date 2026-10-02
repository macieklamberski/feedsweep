import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = '123formbuilder'

// 123ContactForm is the platform's former name, and its host still serves the same form ids.
const oneTwoThreeFormBuilderHosts = ['123formbuilder.com', '123contactform.com']

const loaderPathRegex = /^\/embed\/([^/]+)\.js$/
const formPathRegex = /^\/(\d+)\/?$/
const legacyFramePathRegex = /^\/my-contact-form-(?:a\d+-)?(\d+)\.html$/

// A form's height follows its fields, and the frame posts none to a parent that runs no
// iframe-resizer handshake.
const formHeight = 1036

const composeEmbed = (formId: string): EmbedResolverResult => {
  return {
    provider,
    id: formId,
    src: `https://form.123formbuilder.com/${formId}`,
    url: `https://form.123formbuilder.com/${formId}`,
    height: formHeight,
  }
}

// The form page, `form.123formbuilder.com/{id}`, and the older iframe snippet's
// `my-contact-form-{id}.html`, which redirects onto the same host.
export const oneTwoThreeFormBuilderResolveEmbed: ResolveEmbed = (url) => {
  const pathname = parseUrl(url, placeholderBaseUrl)?.pathname ?? ''
  const formId = pathname.match(formPathRegex)?.[1] ?? pathname.match(legacyFramePathRegex)?.[1]

  if (!formId) {
    return
  }

  return composeEmbed(formId)
}

// The inline form, written in place by `/embed/{id}.js`, a script the pipeline drops. The frame
// the loader writes carries the host page's address in `ref`, so the form page is minted instead.
export const oneTwoThreeFormBuilderScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="123formbuilder.com/embed/"], script[src*="123contactform.com/embed/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), oneTwoThreeFormBuilderHosts)
    const formId = loader?.pathname.match(loaderPathRegex)?.[1]

    if (!loader || !formId) {
      return
    }

    // The loader writes nothing without `data-role="form"`, and `?type=lightbox` opens the form
    // in an overlay from a text link, which is chrome.
    if (attr(element, 'data-role') !== 'form' || loader.searchParams.get('type') === 'lightbox') {
      return
    }

    return composeEmbed(formId)
  },
)

export const oneTwoThreeFormBuilderIframeEmbedResolver = createUrlEmbedResolver(
  oneTwoThreeFormBuilderHosts,
  oneTwoThreeFormBuilderResolveEmbed,
)
