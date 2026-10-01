import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'matterport'

const matterportHosts = ['my.matterport.com']

const showPathRegex = /^\/show\/?$/

// The start pose a shared location link writes, the keys the showcase reads to place the camera.
const navigationParams = ['start', 'sm', 'sp', 'sq', 'sr', 'ss', 'sf', 'sz']

// A Matterport 3D Showcase, `my.matterport.com/show/?m={id}`, a walk-through of a scanned space.
const matterportResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !showPathRegex.test(parsed.pathname)) {
    return
  }

  const id = parsed.searchParams.get('m')

  if (!id) {
    return
  }

  const query = composeQuery({ m: id, ...pickQueryParams(parsed.search, navigationParams) })

  return {
    provider,
    id,
    src: `https://my.matterport.com/show/${query}`,
    url: `https://my.matterport.com/show/${composeQuery({ m: id })}`,
    thumbnail: `https://my.matterport.com/api/v2/player/models/${encodePathSegment(id)}/thumb/`,
    ratio: '4/3',
    title: attr(element, 'title'),
  }
}

export const matterportEmbedResolver = createUrlEmbedResolver(
  matterportHosts,
  matterportResolveEmbed,
)

// Without `play=1` the showcase waits on its own play button, a second click after the reader's.
export const matterportRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { play: '1' },
}
