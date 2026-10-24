import { getQueryParam, parseUrl, trimObject } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { flashVars } from '../utils/dom.js'
import { composeQuery, encodePathSegment, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const viewerRatio = '300/194'

// Calaméo's viewer, `v.calameo.com/?bkcode={code}`, and the retired Flash players before it,
// `cviewer.swf` and `cmini.swf`, take the same code in the same query parameter, or in the
// player's flashvars when the `<embed src>` names a bare `cmini.swf`.
export const calameoResolveEmbed: ResolveEmbed = (url, element) => {
  const urlParams = parseUrl(url, placeholderBaseUrl)?.searchParams
  const params =
    urlParams && getQueryParam(urlParams, 'bkcode') !== undefined
      ? urlParams
      : new URLSearchParams(flashVars(element))
  const code = getQueryParam(params, 'bkcode')

  if (!code) {
    return
  }

  // The viewer reads every name in any case, and the Flash players wrote a private publication's
  // token as `AuthID`.
  const namedParams = new URLSearchParams()

  for (const [name, value] of params) {
    namedParams.append(name.toLowerCase(), value)
  }

  const authId = getQueryParam(namedParams, 'authid')
  // The page the viewer opens on.
  const page = getQueryParam(namedParams, 'page')
  const query = composeQuery(trimObject({ bkcode: code, page, authid: authId }, Boolean))
  const src = `https://v.calameo.com/${query}`

  // The book page answers 404 without the token, and the token stays in the player url alone.
  if (authId) {
    return {
      provider: 'calameo',
      id: code,
      src,
      ratio: viewerRatio,
    }
  }

  return {
    provider: 'calameo',
    id: code,
    src,
    // The code comes out of a query decoded, and it goes into a path.
    url: `https://www.calameo.com/books/${encodePathSegment(code)}`,
    ratio: viewerRatio,
  }
}

export const calameoEmbedResolver = createUrlEmbedResolver(['calameo.com'], calameoResolveEmbed)
