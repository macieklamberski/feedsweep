import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A publication code is hex, and nothing else may reach a minted path.
const safeCodeRegex = /^[0-9a-f]+$/i

// Calaméo's viewer, `v.calameo.com/?bkcode={code}`, and the retired Flash players before it,
// `cviewer.swf` and `cmini.swf`, take the same code in the same query parameter. The Flash
// forms render nothing today and the viewer answers a real code with the publication's title.
export const calameoResolveEmbed: ResolveEmbed = (url) => {
  const code = parseUrl(url, placeholderBaseUrl)?.searchParams.get('bkcode')

  if (!code || !safeCodeRegex.test(code)) {
    return
  }

  return {
    provider: 'calameo',
    id: code,
    src: `https://v.calameo.com/?bkcode=${code}`,
    url: `https://www.calameo.com/books/${code}`,
  }
}

export const calameoEmbedResolver = createUrlEmbedResolver(['calameo.com'], calameoResolveEmbed)
