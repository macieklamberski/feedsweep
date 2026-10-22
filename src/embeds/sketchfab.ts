import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { alphanumericRegex, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'sketchfab'

// A model uid is 32 hex characters, and it also ends the slugged page url
// (`/3d-models/{slug}-{uid}`), which is how a pasted page link is read. The shape tells a uid from
// the listing words that share the bare page route, such as `/models/popular`.
const safeUidRegex = /^[0-9a-f]{32}$/i
// The lengths tell the uid from the slug words before it. Older models end the slug in a
// 26-character uid in letters of both cases.
const sluggedUidRegex = /(?<uid>[0-9a-f]{32}|[0-9a-z]{26})$/i

const sketchfabHosts = ['sketchfab.com']

const readModelUid = (parsed: URL): string | undefined => {
  const [route, second, third] = getPathSegments(parsed)

  if (route === 'models' && third === undefined) {
    return keepIfMatches(second, safeUidRegex)
  }

  // The viewer is `/models/{uid}/embed`, which the retired `/embed/{uid}` and `/show/{uid}`
  // redirect to.
  if ((route === 'models' && third === 'embed') || route === 'embed' || route === 'show') {
    // Older models carry a 26-character uid in letters of both cases, which the viewer still plays.
    return keepIfMatches(second, alphanumericRegex)
  }

  if (route === '3d-models') {
    return second?.match(sluggedUidRegex)?.groups?.uid
  }
}

// The thumbnail sits under a per-model hash that the uid does not yield, and
// `sketchfab.com/oembed?url=…` answers with it and the title, with no key.
const sketchfabResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const writtenUid = parsed ? readModelUid(parsed) : undefined

  if (!writtenUid) {
    return
  }

  // The api and oEmbed answer 404 for a hex uid in capitals. The 26-character uids are
  // case-sensitive, so they stay as written.
  const uid = safeUidRegex.test(writtenUid) ? writtenUid.toLowerCase() : writtenUid

  return {
    provider,
    id: uid,
    src: `https://sketchfab.com/models/${uid}/embed`,
    // The slug is not derivable from the uid, and the site redirects the unslugged `/models/{uid}`
    // to the `/3d-models/{slug}-{uid}` page.
    url: `https://sketchfab.com/models/${uid}`,
    ratio: '4/3',
    title: attr(element, 'title'),
  }
}

// Sketchfab's viewer iframe, /models/{uid}/embed, its retired spellings and a pasted page link.
export const sketchfabEmbedResolver = createUrlEmbedResolver(sketchfabHosts, sketchfabResolveEmbed)

export const sketchfabFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'A 3D model' },
]

// Starts the viewer on the click that loads it; there is no audio to hold back.
export const sketchfabRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autostart: '1' },
}
