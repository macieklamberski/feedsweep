import { composeQuery, encodePathSegment, getQueryParam, getQueryParams } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'matterport'

const hosts = ['my.matterport.com']

const showPathRegex = /^\/show\/?$/i

const sizes = {
  player: { ratio: '4/3' },
}

// The start pose a shared location link writes, the keys the showcase reads to place the camera.
const navigationParams = ['start', 'sm', 'sp', 'sq', 'sr', 'ss', 'sf', 'sz']

// A Matterport 3D Showcase, `my.matterport.com/show/?m={id}`, a walk-through of a scanned space.
const matterportResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (!showPathRegex.test(url.pathname)) {
    return
  }

  const id = getQueryParam(url.searchParams, 'm')

  if (!id) {
    return
  }

  const query = composeQuery({ m: id, ...getQueryParams(url.search, navigationParams) })

  return {
    provider,
    id,
    src: `https://my.matterport.com/show/${query}`,
    url: `https://my.matterport.com/show/${composeQuery({ m: id })}`,
    thumbnail: `https://my.matterport.com/api/v2/player/models/${encodePathSegment(id)}/thumb/`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const matterportEmbedResolver = createUrlEmbedResolver(hosts, matterportResolveEmbed)

// Without `play=1` the showcase waits on its own play button, a second click after the reader's.
export const matterportRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { play: '1' },
}
