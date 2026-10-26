import type { ResolveUrlEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ardmediathek'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['ardmediathek.de']

// The legacy `/{channel}/embed/{id}` route 404s.
const embedPathRegex = /^\/(?:\w+\/)?embed\/([^/]+)\/?$/i

const ardmediathekResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = url.pathname.match(embedPathRegex)?.[1]

  if (!id) {
    return
  }

  // `api.ardmediathek.de/page-gateway/pages/ard/item/{id}` answers with the title, the
  // contributing broadcaster and the image, with no key, for the id as the carrier spells it.
  return {
    provider,
    id,
    src: `https://www.ardmediathek.de/embed/${id}${pickUrlParams(url, ['startTime'])}`,
    url: `https://www.ardmediathek.de/video/${id}`,
    ...sizes.player,
  }
}

// The ARD Mediathek player iframe on the `/embed/{id}` route and the legacy channel route.
export const ardmediathekEmbedResolver = createUrlEmbedResolver(hosts, ardmediathekResolveEmbed)
