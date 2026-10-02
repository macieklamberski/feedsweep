import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'lglforms'

const lglformsHosts = ['secure.lglforms.com']

const formPathRegex = /^\/form_engine\/s\/([^/]+)$/
const loaderPathRegex = /^\/form_engine\/s\/([^/]+)\.js$/

// A form's height follows its fields, and the frame posts one only to the page its `origin`
// query names, which is the reader's own address.
const formHeight = 1288

const composeEmbed = (formKey: string): EmbedResolverResult => {
  return {
    provider,
    id: formKey,
    src: `https://secure.lglforms.com/form_engine/s/${formKey}`,
    url: `https://secure.lglforms.com/form_engine/s/${formKey}`,
    height: formHeight,
  }
}

// The form page, `secure.lglforms.com/form_engine/s/{key}`.
export const lglformsResolveEmbed: ResolveEmbed = (url) => {
  const formKey = parseUrlOnHosts(url, lglformsHosts)?.pathname.match(formPathRegex)?.[1]

  if (!formKey) {
    return
  }

  return composeEmbed(formKey)
}

// LGL Forms' embed, a script that writes the form's frame in place and that the pipeline drops.
// The frame it writes carries the host page's address in `origin`, so the form page is minted.
export const lglformsScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="lglforms.com/form_engine/s/"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), lglformsHosts)
    const formKey = loader?.pathname.match(loaderPathRegex)?.[1]

    if (!formKey) {
      return
    }

    return composeEmbed(formKey)
  },
)

export const lglformsIframeEmbedResolver = createUrlEmbedResolver(
  lglformsHosts,
  lglformsResolveEmbed,
)
