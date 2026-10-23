import { parseUrl, toMap } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'zohoworkdrive'

// A file lives in one data centre, and only that centre's domain serves it. Each spelling maps
// onto the public domain its centre's app host redirects `/embed/{id}` to: `zohoexternal.com`
// and `zohopublic.eu`. The Indian centre is claimed only on the `zohoexternal.in` it is seen on.
const zohoworkdriveDomains = toMap({
  'workdrive.zoho.com': 'zohoexternal.com',
  'workdrive.zohoexternal.com': 'zohoexternal.com',
  'workdrive.zohoexternal.in': 'zohoexternal.in',
  'workdrive.zohopublic.com': 'zohoexternal.com',
  'workdrive.zohopublic.eu': 'zohopublic.eu',
})

const zohoworkdriveHosts = [...zohoworkdriveDomains.keys()]

// `/embed/{fileId}` is the embed dialog's frame. `/external/{linkId}` is a share link's page, and
// its `/embed` suffix only spins, so it is rebuilt without it.
const embedPathRegex = /^\/embed\/([^/]+)$/
const externalPathRegex = /^\/external\/([^/]+)(?:\/embed)?$/

// The only playback setting the dialog writes besides autoplay.
const playbackParams = ['loop']

// A link id is 64 hex digits, which the server reads in any case.
const linkIdRegex = /^[0-9a-f]{64}$/i

// The dialog marks a video's frame with `zpvideo`, and a document's with `zpiframe` or `embedcon`.
// The video player fills the frame, and a document page scrolls under a 64px header.
const readRatio = (element: Element | undefined): string => {
  return element?.classList.contains('zpvideo') ? '16/9' : '4/3'
}

export const zohoworkdriveResolveEmbed: ResolveEmbed = (url, element) => {
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
      ratio: readRatio(element),
    }
  }

  const linkId = parsed.pathname.match(externalPathRegex)?.[1]

  if (!linkId) {
    return
  }

  const page = `https://workdrive.${domain}/external/${linkId}`

  return {
    provider,
    id: `external/${linkIdRegex.test(linkId) ? linkId.toLowerCase() : linkId}`,
    src: page,
    url: page,
    ratio: readRatio(element),
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
