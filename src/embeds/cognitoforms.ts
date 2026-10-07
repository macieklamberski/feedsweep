import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, find, text } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'cognitoforms'

// `services.cognitoforms.com` is the older embed host, and still serves the same forms.
const cognitoformsHosts = ['www.cognitoforms.com', 'services.cognitoforms.com']

const seamlessPathRegex = /^\/f\/seamless\.js$/
// The loader's `Cognito.load` refuses any kind but `"forms"`, and mounts the form named by `id`.
const loadCallRegex = /Cognito\.load\(\s*"forms"\s*,\s*\{\s*id\s*:\s*"([^"]+)"/

// A form's height follows its fields, and the frame reports one only over a channel the
// parent opens in answer to its `cog-handshake`, so a long form scrolls inside the frame.
const formHeight = 600

const composeEmbed = (orgKey: string, formNumber: string, query = ''): EmbedResolverResult => {
  return {
    provider,
    id: `${orgKey}/${formNumber}`,
    src: `https://www.cognitoforms.com/f/${orgKey}/${formNumber}${query}`,
    url: `https://www.cognitoforms.com/f/${orgKey}/${formNumber}`,
    height: formHeight,
  }
}

// The form page, `www.cognitoforms.com/f/{org}/{form}`, and the older
// `services.cognitoforms.com/f/{org}?id={form}`, which serves the same form.
export const cognitoformsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, cognitoformsHosts)

  if (!parsed) {
    return
  }

  const [route, orgKey, pathNumber, ...rest] = getPathSegments(parsed)
  const formNumber = pathNumber ?? parsed.searchParams.get('id')

  if (!isAnyOf(route, 'f') || !orgKey || !formNumber || rest.length > 0) {
    return
  }

  // `entry` prefills the form.
  return composeEmbed(orgKey, formNumber, pickUrlParams(parsed.href, ['entry']))
}

// Cognito Forms' seamless embed, a script that renders the form into the page itself and that
// the pipeline drops.
export const cognitoformsScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="cognitoforms.com/f/seamless.js"][data-key][data-form]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), cognitoformsHosts)
    const orgKey = attr(element, 'data-key')
    const formNumber = attr(element, 'data-form')

    if (!loader || !seamlessPathRegex.test(loader.pathname) || !orgKey || !formNumber) {
      return
    }

    return composeEmbed(orgKey, formNumber)
  },
)

export const cognitoformsIframeEmbedResolver = createUrlEmbedResolver(
  cognitoformsHosts,
  cognitoformsResolveEmbed,
)

// Cognito Forms' oldest embed, a `div.cognito` holding the loader `/s/{org}` and an inline
// `Cognito.load` call, which mount the form into the div only when a page runs them.
export const cognitoformsWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.cognito',
  (element) => {
    const loader = parseUrlOnHosts(attr(find(element, 'script[src]'), 'src'), cognitoformsHosts)

    if (!loader) {
      return
    }

    const [route, orgKey, ...rest] = getPathSegments(loader)
    const formNumber = text(element, 'script:not([src])')?.match(loadCallRegex)?.[1]

    if (!isAnyOf(route, 's') || !orgKey || rest.length > 0 || !formNumber) {
      return
    }

    return composeEmbed(orgKey, formNumber)
  },
)
