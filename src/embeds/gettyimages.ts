import type { ResolveEmbed } from '../types.js'
import { parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The asset id Getty calls `items`, and the opaque embed token it calls `et`.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/
const ampPrefixRegex = /^(amp;)+/

const gettyImagesHosts = ['gettyimages.com']

type WidgetConfig = {
  items: string
  et: string
  sig: string
  tld: string
  width?: number
  height?: number
}

// Getty signs the query up to `sig` in the order written: a pair dropped or moved before it
// answers 400. The pairs after it, such as `caption` and `ver`, are unsigned.
const readSignedQuery = (url: URL): string => {
  const pairs = url.search.slice(1).split('&')
  // A doubled `&amp;amp;` in the feed reaches the query as `amp;sig=`.
  const isSignaturePair = (pair: string) => {
    return pair.replace(ampPrefixRegex, '').startsWith('sig=')
  }
  const signedPairs = pairs.slice(0, pairs.findIndex(isSignaturePair) + 1)

  return signedPairs.length > 0 ? `?${signedPairs.join('&')}` : ''
}

const gettyImagesResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, gettyImagesHosts)
  const itemId = parsed?.pathname.match(embedPathRegex)?.[1]

  if (!parsed || !itemId) {
    return
  }

  return {
    provider: 'gettyimages',
    // `embed.gettyimages.com/oembed?url=http://gty.im/{items}` answers title, caption,
    // photographer, collection and a thumbnail with no key, and 404s on an invented id.
    id: itemId,
    src: `https://embed.gettyimages.com/embed/${itemId}${readSignedQuery(parsed)}`,
    url: `https://www.gettyimages.com/detail/${itemId}`,
  }
}

// Getty's player iframe, `embed.gettyimages.com/embed/{id}` signed for one publisher in its query.
export const gettyImagesEmbedResolver = createUrlEmbedResolver(
  gettyImagesHosts,
  gettyImagesResolveEmbed,
)

// The config is a JavaScript object literal, not JSON, with unquoted keys and free spacing around
// the values, `items: '674950774' ,`.
const readConfigValue = (source: string, key: string): string | undefined => {
  return source.match(new RegExp(`\\b${key}\\s*:\\s*'([^']*)'`))?.[1]
}

// What `rebuildGettyImagesEmbeds` needs out of a `gie.widgets.load({...})` call. Exported for
// that transform alone: the platform's url shape is spelled here, never in the transform.
// The `gie` widget is an `<a class="gie-single">` beside an inline `<script>` holding the config.
export const readWidgetConfig = (source: string): WidgetConfig | undefined => {
  const items = readConfigValue(source, 'items')
  // The config spells the embed token `id`, and the player url spells it `et`.
  const et = readConfigValue(source, 'id')
  const sig = readConfigValue(source, 'sig')

  if (!items || !et || !sig) {
    return
  }

  return {
    items,
    et,
    sig,
    tld: readConfigValue(source, 'tld') ?? 'com',
    width: parsePixelSize(readConfigValue(source, 'w')),
    height: parsePixelSize(readConfigValue(source, 'h')),
  }
}

// The signature is bound to the item: a config's own url answers 200, and the same url carrying
// another specimen's signature 400. Signatures do not appear to expire.
export const composeWidgetEmbedUrl = (config: WidgetConfig): string => {
  const query = new URLSearchParams({
    et: config.et,
    tld: config.tld,
    sig: config.sig,
  })

  return `https://embed.gettyimages.com/embed/${config.items}?${query}`
}
