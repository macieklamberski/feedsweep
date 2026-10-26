import { composeQuery, encodePathSegment, getQueryParam, isAnyOf, trimObject } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, flashVars, parseFlashVars } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'calameo'

const sizes = {
  viewer: { ratio: '300/194' },
  // One shelf of the library widget. Its frame is this tall for every row it shows.
  library: { height: 185 },
}

const libraryPathRegex = /^\/library\/?$/i

// The account library widget, `v.calameo.com/library/?type=account&id={account}&rows={rows}`,
// draws its shelves 185 pixels a row at its default thumbnail size. It reads `rows` with
// `parseInt`, and a count below one fills the frame, which at that height is one row.
const resolveLibrary = (url: URL): EmbedResolverResult | undefined => {
  const accountId = getQueryParam(url.searchParams, 'id')

  if (!isAnyOf(getQueryParam(url.searchParams, 'type'), 'account') || !accountId) {
    return
  }

  const rows = getQueryParam(url.searchParams, 'rows')
  const rowCount = Number.parseInt(rows ?? '', 10)
  const query = composeQuery(trimObject({ type: 'account', id: accountId, rows }, Boolean))

  return {
    provider,
    id: `library/account/${accountId}`,
    src: `https://v.calameo.com/library/${query}`,
    url: `https://www.calameo.com/accounts/${encodePathSegment(accountId)}`,
    height: sizes.library.height * (rowCount > 0 ? rowCount : 1),
  }
}

// Calaméo's viewer, `v.calameo.com/?bkcode={code}`, and the retired Flash players before it,
// `cviewer.swf` and `cmini.swf`, take the same code in the same query parameter, or in the
// player's flashvars when the `<embed src>` names a bare `cmini.swf`.
export const calameoResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (libraryPathRegex.test(url.pathname)) {
    return resolveLibrary(url)
  }

  const urlParams = url.searchParams
  const params =
    urlParams && getQueryParam(urlParams, 'bkcode') !== undefined
      ? urlParams
      : parseFlashVars(flashVars(element))
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
      provider,
      id: code,
      src,
      ...sizes.viewer,
      title: attr(element, 'title'),
    }
  }

  return {
    provider,
    id: code,
    src,
    // The code comes out of a query decoded, and it goes into a path.
    url: `https://www.calameo.com/books/${encodePathSegment(code)}`,
    ...sizes.viewer,
    title: attr(element, 'title'),
  }
}

export const calameoEmbedResolver = createUrlEmbedResolver(['calameo.com'], calameoResolveEmbed)
