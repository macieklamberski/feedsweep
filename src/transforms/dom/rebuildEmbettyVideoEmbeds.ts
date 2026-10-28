import { encodePathSegment, toMap } from 'trousse'
import { composeEmbedUrl as composeFacebookUrl } from '../../embeds/facebook.js'
import { composeEmbedUrl as composeVimeoUrl } from '../../embeds/vimeo.js'
import { composeEmbedUrl as composeYoutubeUrl } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe } from '../../utils/widgets.js'

type ComposeUrl = (id: string, start: string | undefined) => string

// Embetty writes `start-at` into YouTube's `start` and Vimeo's `#t=` as it is, and both count
// seconds. Its `facebook` type takes no start.
// See: https://github.com/heiseonline/embetty/tree/master/embetty/src/embed/video/type.
const composers = toMap<ComposeUrl>({
  facebook: (id) => {
    return composeFacebookUrl(id)
  },
  youtube: (id, start) => {
    const segment = encodePathSegment(id)

    if (!start) {
      return composeYoutubeUrl(segment)
    }

    return composeYoutubeUrl(segment, { start })
  },
  vimeo: (id, start) => {
    return composeVimeoUrl(encodePathSegment(id), undefined, start)
  },
})

// embetty-video is a web component that names the player in `type` and only builds its iframe
// with JS on click.
export const rebuildEmbettyVideoEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('embetty-video[type][video-id]')) {
    const compose = composers.get(attr(element, 'type')?.toLowerCase() ?? '')
    const id = attr(element, 'video-id')

    if (!compose || !id) {
      continue
    }

    const src = compose(id, attr(element, 'start-at'))
    const iframe = createIframe(document, src)

    element.replaceWith(iframe)
  }
}
