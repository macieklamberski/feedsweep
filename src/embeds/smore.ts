import { getPathSegments, parseUrl } from 'trousse'
import type { FieldCleaner } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'smore'

const legacyHost = 'www.smore.com'

// The newsletter page posts no height to its parent, so a long newsletter scrolls inside the frame.
const newsletterHeight = 600

// A newsletter is `www.smore.com/{key}-{slug}` on the legacy host and `/n/{key}-{slug}` on
// `app.smore.com` and `secure.smore.com`. The slug is cosmetic and the key is case-sensitive.
export const smoreEmbedResolver = createUrlEmbedResolver(
  [legacyHost, 'app.smore.com', 'secure.smore.com'],
  (url, element) => {
    const parsed = parseUrl(url)

    if (!parsed) {
      return
    }

    const segments = getPathSegments(parsed)
    const isLegacy = parsed.hostname === legacyHost

    if (!isLegacy && segments[0] !== 'n') {
      return
    }

    const keySegments = isLegacy ? segments : segments.slice(1)

    if (keySegments.length !== 1) {
      return
    }

    const key = keySegments[0].split('-')[0]

    if (!key) {
      return
    }

    return {
      provider,
      id: key,
      src: `https://app.smore.com/n/${key}?embedded`,
      url: `https://app.smore.com/n/${key}`,
      height: newsletterHeight,
      title: attr(element, 'title'),
    }
  },
)

export const smoreFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Smore newsletter' }, // Embed dialog, when the page has no og:title
]
