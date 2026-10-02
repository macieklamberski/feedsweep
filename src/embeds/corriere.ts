import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The regional `video.corrieredelmezzogiorno.corriere.it` keeps its own videos, which
// `video.corriere.it` answers with a 404, so the frame host is not widened to `corriere.it`.
const corriereFrameHosts = ['video.corriere.it']
const corriereFlashHosts = ['corriereobjects.it']

const rssFileRegex = /^video_(.+)\.rss$/

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider: 'corriere',
    id,
    src: `https://video.corriere.it/video-embed/${id}`,
    url: `https://video.corriere.it/x/${id}`,
    ratio: '16/9',
  }
}

// The retired players named the video by its feed, `…/widget/content/video/rss/video_{id}.rss`,
// and the id is the one the current player takes.
const readFeedVideo = (value: string | undefined): EmbedResolverResult | undefined => {
  const feed = parseUrlOnHosts(value, corriereFlashHosts)

  if (!feed) {
    return
  }

  const id = getPathSegments(feed).at(-1)?.match(rssFileRegex)?.[1]

  if (!id) {
    return
  }

  return composeEmbed(id)
}

// Corriere della Sera's video player, `video.corriere.it/video-embed/{id}`, and two retired
// players that render nothing: the Flash widget `static2.video.corriereobjects.it/widget/swf/`,
// with the feed in `videoUrl` flashvars, and `video.corriere.it/widget/players/`, with the feed
// in its `videoId` query.
export const corriereResolveEmbed: ResolveEmbed = (url, element) => {
  const flash = parseUrlOnHosts(url, corriereFlashHosts)

  if (flash) {
    const [widget, swf, , ...rest] = getPathSegments(flash)

    if (widget !== 'widget' || swf !== 'swf' || rest.length > 0) {
      return
    }

    return readFeedVideo(flashVar(element, 'videoUrl'))
  }

  const parsed = parseUrlOnHosts(url, corriereFrameHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments.length === 3) {
    const [widget, players] = segments

    if (widget !== 'widget' || players !== 'players') {
      return
    }

    return readFeedVideo(parsed.searchParams.get('videoId') ?? undefined)
  }

  if (segments.length === 2) {
    const [videoEmbed, id] = segments

    if (videoEmbed !== 'video-embed') {
      return
    }

    return composeEmbed(id)
  }
}

export const corriereEmbedResolver = createUrlEmbedResolver(
  [...corriereFrameHosts, ...corriereFlashHosts],
  corriereResolveEmbed,
)
