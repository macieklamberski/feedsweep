import { encodePathSegment, toMap } from 'trousse'
import { composeEmbedUrl as composeVimeoUrl } from '../../embeds/vimeo.js'
import { composeEmbedUrl as composeYoutubeUrl } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe } from '../../utils/widgets.js'

type ComposeUrl = (id: string, start: string | undefined) => string

// Embetty writes `start-at` into YouTube's `start` and Vimeo's `#t=` as it is, and both count
// seconds. Its `facebook` type needs a page url only the embetty server holds.
// See: https://github.com/heiseonline/embetty/tree/master/embetty/src/embed/video/type.
const composers = toMap<ComposeUrl>({
  youtube: (id, start) => {
    if (!start) {
      return composeYoutubeUrl(id)
    }

    return composeYoutubeUrl(id, { start })
  },
  vimeo: (id, start) => {
    return composeVimeoUrl(id, undefined, start)
  },
})

// embetty-video is a web component that names the player in `type` and only builds its iframe
// with JS on click.
export const rebuildEmbettyVideoEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('embetty-video[type][video-id]')) {
    const compose = composers.get(attr(element, 'type')?.toLowerCase() ?? '')
    // The id comes out of its attribute decoded, and it goes into a path.
    const segment = encodePathSegment(attr(element, 'video-id') ?? '')

    if (!compose || !segment) {
      continue
    }

    const src = compose(segment, attr(element, 'start-at'))
    const iframe = createIframe(document, src)

    element.replaceWith(iframe)
  }
}
