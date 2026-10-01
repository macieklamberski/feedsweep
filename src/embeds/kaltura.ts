import type { EmbedRenderHint, EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, encodePathSegment, filterUrlQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'kaltura'

const partnerPathRegex = /^\/p\/([^/]+)\//

const kalturaHost = 'kaltura.com'

// The SaaS hosts all serve the player and the thumbnail from `cdnapisec.kaltura.com`; a regional
// API host (`api.ca.kaltura.com`) serves them only itself, so the carrier's host is kept there.
const saasHosts = new Set(['kaltura.com', 'www.kaltura.com', 'cdnapi.kaltura.com'])

// The clip's start and end, as the embedIframeJs player and the embedPlaykitJs player read them.
const playbackParams = [
  'flashvars[mediaProxy.mediaPlayFrom]',
  'flashvars[mediaProxy.mediaPlayTo]',
  'kalturaSeekFrom',
  'kalturaClipTo',
]

// The session token an access-controlled entry plays with. It stays in `src` as written, and an
// entry that needs it gets no thumbnail, since the poster would need it too.
const tokenParam = 'flashvars[ks]'

type Entry = {
  partner: string
  entryId: string
  parsed: URL
}

const readEntry = (url: string | undefined): Entry | undefined => {
  const parsed = parseUrlOnHosts(url, kalturaHost)
  const partner = parsed?.pathname.match(partnerPathRegex)?.[1]
  const entryId = parsed?.searchParams.get('entry_id')

  return parsed && partner && entryId ? { partner, entryId, parsed } : undefined
}

// The player path names the partner and the player config. Without `iframeembed=true` the same
// route answers the auto-embed script, not a player.
const composeEmbed = ({ partner, entryId, parsed }: Entry): EmbedResolverResult => {
  const host = saasHosts.has(parsed.hostname) ? 'cdnapisec.kaltura.com' : parsed.hostname
  const query = composeQuery({ iframeembed: 'true', entry_id: entryId })
  const hasToken = parsed.searchParams.has(tokenParam)
  const kept = filterUrlQuery(
    parsed,
    (name) => name === tokenParam || playbackParams.includes(name),
  )
  const playback = kept.replace('?', '&')
  // The entry comes out of the query decoded, and it goes into a path.
  const entrySegment = encodePathSegment(entryId)

  return {
    provider,
    // Title and metadata sit behind a session key.
    id: `${partner}/${entryId}`,
    src: `https://${host}${parsed.pathname}${query}${playback}`,
    // The poster answers 200 `image/jpeg` for a real entry, 404 for an invented or a deleted one.
    thumbnail: hasToken
      ? undefined
      : `https://${host}/p/${partner}/thumbnail/entry_id/${entrySegment}/width/640`,
  }
}

export const kalturaResolveEmbed: ResolveEmbed = (url, element) => {
  const entry = readEntry(url)

  if (!entry) {
    return
  }

  return { ...composeEmbed(entry), title: attr(element, 'title') }
}

// Kaltura's embedIframeJs and embedPlaykitJs iframes, which render and only lack a poster.
// The Flash-era `index.php/kwidget/…` and `extwidget/embedIframe/…` routes have lost their
// player libraries, and the entry alone does not mint a working player.
export const kalturaIframeEmbedResolver = createUrlEmbedResolver([kalturaHost], kalturaResolveEmbed)

// Kaltura's auto-embed script, which writes the iframe into an empty div at load time. Feeds strip
// the script, and the emptied div dies as an empty tag with the video.
export const kalturaScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="kaltura.com/p/"]',
  (element) => {
    const entry = readEntry(attr(element, 'src'))

    if (entry?.parsed.searchParams.get('autoembed') !== 'true') {
      return
    }

    return { ...composeEmbed(entry), ratio: '16/9' }
  },
)

export const kalturaFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Kaltura Player' },
]

export const kalturaRenderHint: EmbedRenderHint = {
  provider,
  // The player reads its options from the `flashvars[...]` namespace, not a bare `autoPlay`.
  // Out of a url the key reads `flashvars%5BautoPlay%5D`.
  autoplayParams: { 'flashvars[autoPlay]': 'true' },
}
