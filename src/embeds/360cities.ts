import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = '360cities'

const threeSixtyCitiesHosts = ['360cities.net']

const framePathRegex = /^\/embed_iframe\/([^/]+)$/
const flashPlayerPathRegex = /^\/javascripts\/krpano\/krpano\.swf$/
const flashPanoPathRegex = /^\/krpano\/external_embed\/([^/]+)\.xml$/

const composeEmbed = (slug: string): EmbedResolverResult => {
  return {
    provider,
    id: slug,
    src: `https://www.360cities.net/embed_iframe/${slug}`,
    url: `https://www.360cities.net/image/${slug}`,
    ratio: '425/315',
  }
}

// The retired Flash viewer `360cities.net/javascripts/krpano/krpano.swf`, which renders nothing
// and names the panorama in flashvars as `pano=…/krpano/external_embed/{slug}.xml`, and the
// frame `360cities.net/embed_iframe/{slug}`.
export const threeSixtyCitiesResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, threeSixtyCitiesHosts)

  if (!parsed) {
    return
  }

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    const pano = parseUrlOnHosts(flashVar(element, 'pano'), threeSixtyCitiesHosts)
    const slug = pano?.pathname.match(flashPanoPathRegex)?.[1]

    if (!slug) {
      return
    }

    return composeEmbed(slug)
  }

  const slug = parsed.pathname.match(framePathRegex)?.[1]

  if (!slug) {
    return
  }

  return composeEmbed(slug)
}

export const threeSixtyCitiesEmbedResolver = createUrlEmbedResolver(
  threeSixtyCitiesHosts,
  threeSixtyCitiesResolveEmbed,
)
