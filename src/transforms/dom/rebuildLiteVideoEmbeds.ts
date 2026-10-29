import { encodePathSegment, toMap, trimObject } from 'trousse'
import { composeEmbedUrl as composeVimeoUrl } from '../../embeds/vimeo.js'
import { composeEmbedUrl as composeYoutubeUrl, youtubeEmbedParams } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { digitsRegex, pickQueryParams } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

type EmbedSource = {
  params: ReadonlyArray<string>
  startAttributes: ReadonlyArray<string>
  // An attribute naming a playlist, which the component plays in place of the video.
  playlistAttribute?: string
  compose: (id: string, params: Record<string, string>, element: Element) => string
}

const embedSources = toMap<EmbedSource>({
  'lite-youtube': {
    params: youtubeEmbedParams,
    // justinribeiro's lite-youtube writes `videoStartAt` into the player's `start` as it stands.
    startAttributes: ['start', 'videostartat'],
    playlistAttribute: 'playlistid',
    compose: (id, params) => composeYoutubeUrl(id, params),
  },
  // Vimeo's player takes the offset as a #t= fragment and reads nothing else. lite-vimeo's
  // `start` is either bare seconds or the player's own form, `5m30s`.
  'lite-vimeo': {
    params: ['start'],
    startAttributes: ['start'],
    compose: (id, params, element) => {
      const start = digitsRegex.test(params.start ?? '') ? `${params.start}s` : params.start
      // An unlisted video plays only with its hash, which the player takes as h=.
      const query = trimObject({ h: element.getAttribute('videohash') }, Boolean)

      return composeVimeoUrl(id, query, start)
    },
  },
})

// Some feeds escape the attribute's quotes twice, `videoid=\"{id}\"`, and the parser keeps the
// backslashes and quotes as part of the value.
const escapedQuotesRegex = /^\\"(.*)\\"$/

const readAttribute = (element: Element, name: string): string => {
  return element.getAttribute(name)?.replace(escapedQuotesRegex, '$1') ?? ''
}

// lite-youtube and lite-vimeo are web components that only build their iframe with JS on click.
export const rebuildLiteVideoEmbeds: DomTransform = () => (document) => {
  const selector = 'lite-youtube[videoid], lite-youtube[playlistid], lite-vimeo[videoid]'

  for (const element of document.querySelectorAll(selector)) {
    const source = embedSources.get(element.localName)
    // justinribeiro's lite-youtube plays the playlist whenever `playlistid` is set, and its
    // `videoid` then names only the poster.
    const playlistId = source?.playlistAttribute
      ? readAttribute(element, source.playlistAttribute)
      : ''
    // The id comes out of its attribute decoded, and it goes into a path.
    const segment = playlistId
      ? 'videoseries'
      : encodePathSegment(readAttribute(element, 'videoid'))

    if (!source || !segment) {
      continue
    }

    // The options arrive either as the dedicated `start` attribute or inside `params`, and a
    // component may state both. The attribute is the more specific of the two, so it wins.
    const params = pickQueryParams(element.getAttribute('params') ?? '', source.params)
    const start = source.startAttributes.map((name) => element.getAttribute(name)).find(Boolean)

    if (start) {
      params.start = start
    }

    if (playlistId) {
      params.list = playlistId
    }

    const iframe = createIframe(document, source.compose(segment, params, element))

    // paulirish's lite-youtube-embed names the video in `title`.
    const videoTitle = element.getAttribute('videotitle') ?? element.getAttribute('title')
    if (videoTitle) {
      iframe.setAttribute('title', videoTitle)
    }

    element.replaceWith(iframe)
  }
}
