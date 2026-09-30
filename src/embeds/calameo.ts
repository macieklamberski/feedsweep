import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { flashVars, keepIfMatches } from '../utils/dom.js'
import { pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The viewer and the book page both read `langid` as a two-letter language.
const languageRegex = /^[a-z]{2}$/

// The layout, the opening page and the click action the publisher chose for this embed.
// `autoflip` turns pages on a timer, so it is left to the reader like autoplay.
const viewerParams = ['mode', 'view', 'page', 'clickto', 'clicktarget', 'showsharemenu']

// Calaméo's viewer, `v.calameo.com/?bkcode={code}`, and the retired Flash players before it,
// `cviewer.swf` and `cmini.swf`, take the same code in the same query parameter, or in the
// player's flashvars when the `<embed src>` names a bare `cmini.swf`.
export const calameoResolveEmbed: ResolveEmbed = (url, element) => {
  const urlParams = parseUrl(url, placeholderBaseUrl)?.searchParams
  const params = urlParams?.has('bkcode') ? urlParams : new URLSearchParams(flashVars(element))
  const code = params.get('bkcode')

  if (!code) {
    return
  }

  // The viewer reads every name in any case, and the Flash players wrote `clickTo` and a
  // private publication's token as `AuthID`.
  const namedParams = new URLSearchParams()

  for (const [name, value] of params) {
    namedParams.append(name.toLowerCase(), value)
  }

  const langId = keepIfMatches(params.get('langid'), languageRegex)
  const authId = namedParams.get('authid')
  const query = new URLSearchParams({ bkcode: code })

  if (langId) {
    query.set('langid', langId)
  }

  for (const [name, value] of Object.entries(
    pickQueryParams(namedParams.toString(), viewerParams),
  )) {
    query.set(name, value)
  }

  // The book page answers 404 without the token, and the token stays in the player url alone.
  if (authId) {
    query.set('authid', authId)

    return {
      provider: 'calameo',
      id: code,
      src: `https://v.calameo.com/?${query}`,
    }
  }

  const pageQuery = langId ? `?langid=${langId}` : ''

  return {
    provider: 'calameo',
    id: code,
    src: `https://v.calameo.com/?${query}`,
    url: `https://www.calameo.com/books/${code}${pageQuery}`,
  }
}

export const calameoEmbedResolver = createUrlEmbedResolver(['calameo.com'], calameoResolveEmbed)
