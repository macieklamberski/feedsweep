import { parseUrl, toMap } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'zohoworkdrive'

// A file lives in one data centre, and only that centre's domain serves it. Each older spelling
// maps onto the `zohoexternal` domain of its centre, which the embed dialog writes today.
const zohoworkdriveDomains = toMap({
  'workdrive.zoho.com': 'zohoexternal.com',
  'workdrive.zohoexternal.com': 'zohoexternal.com',
  'workdrive.zohoexternal.in': 'zohoexternal.in',
  'workdrive.zohopublic.com': 'zohoexternal.com',
  'workdrive.zohopublic.eu': 'zohoexternal.eu',
})

const zohoworkdriveHosts = [...zohoworkdriveDomains.keys()]

// `/embed/{fileId}` is the embed dialog's frame. `/external/{linkId}` is a share link's page, and
// its `/embed` suffix only spins, so it is rebuilt without it.
const embedPathRegex = /^\/embed\/([^/]+)$/
const externalPathRegex = /^\/external\/([^/]+)(?:\/embed)?$/

// The only playback setting the dialog writes besides autoplay.
const playbackParams = ['loop']

export const zohoworkdriveResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const domain = parsed ? zohoworkdriveDomains.get(parsed.hostname) : undefined

  if (!parsed || !domain) {
    return
  }

  const fileId = parsed.pathname.match(embedPathRegex)?.[1]

  if (fileId) {
    const page = `https://workdrive.${domain}/embed/${fileId}`

    return {
      provider,
      id: `embed/${fileId}`,
      src: `${page}${pickUrlParams(url, playbackParams)}`,
      url: page,
      thumbnail: `https://previewengine.${domain}/thumbnail/WD/${fileId}?size=l`,
      ratio: '4/3',
    }
  }

  const linkId = parsed.pathname.match(externalPathRegex)?.[1]

  if (!linkId) {
    return
  }

  const page = `https://workdrive.${domain}/external/${linkId}`

  return {
    provider,
    // The server reads a link id in any case, and a file id in one only.
    id: `external/${linkId.toLowerCase()}`,
    src: page,
    url: page,
    ratio: '4/3',
  }
}

export const zohoworkdriveEmbedResolver = createUrlEmbedResolver(
  zohoworkdriveHosts,
  zohoworkdriveResolveEmbed,
)

export const zohoworkdriveRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
