import { encodePathSegment, getPathSegments, isAnyOf, isPlainObject } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { filterUrlQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'formmailer'

// The host is part of the form's address: `pro` serves the paid plan's forms, and a form id
// answers 404 on the other host.
const formmailerHosts = ['ssl.form-mailer.jp', 'pro.form-mailer.jp']

// The form reads any field name off its query as a prefill, such as `タイトル[0]`, so the query
// goes to the frame as the carrier sends it. `errorScroll` is the loader's own display setting.
const composeEmbed = (form: URL, hash: string): EmbedResolverResult => {
  const query = filterUrlQuery(form, (name) => !isAnyOf(name, 'errorScroll'))

  return {
    provider,
    id: hash,
    src: `https://${form.host}/fms/${hash}${query}`,
    url: `https://${form.host}/fms/${hash}`,
  }
}

// The form page, `{ssl|pro}.form-mailer.jp/fms/{hash}`.
export const formmailerResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, hash, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'fms') || !hash || rest.length > 0) {
    return
  }

  return composeEmbed(url, hash)
}

// The inline embed, an empty div that `formfiles/js/embed.js` fills with the form's frame. The
// loader writes `data-form-hash` straight into the path, so a prefill query can ride in it.
export const formmailerWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.formmailer-embed[data-form-host][data-form-hash]',
  (element) => {
    const host = attr(element, 'data-form-host')
    const [hash = '', ...prefill] = attr(element, 'data-form-hash')?.split('?') ?? []

    if (!hash) {
      return
    }

    const query = prefill.length ? `?${prefill.join('?')}` : ''

    const url = parseUrlOnHosts(
      `https://${host}/fms/${encodePathSegment(hash)}${query}`,
      formmailerHosts,
    )

    if (!url) {
      return
    }

    return formmailerResolveEmbed(url)
  },
)

export const formmailerIframeEmbedResolver = createUrlEmbedResolver(
  formmailerHosts,
  formmailerResolveEmbed,
)

// The form posts its rendered height unasked, as `{ app: 'formmailer', message: 'heightChanged',
// params: { height } }`, again on each change.
export const readFormmailerHeight = (data: unknown): number | undefined => {
  if (!isPlainObject(data) || data.app !== 'formmailer' || data.message !== 'heightChanged') {
    return
  }

  if (!isPlainObject(data.params)) {
    return
  }

  return readPixels(data.params.height)
}

// No `origin`, since the frame's messages come from `ssl` or `pro`, whichever host serves it.
export const formmailerRenderHint: EmbedRenderHint = {
  provider,
  readHeight: readFormmailerHeight,
}
