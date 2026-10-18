import type { MediaResolver } from '../types.js'
import { attr, jsonAttr } from '../utils/dom.js'

type VideoSource = {
  src?: string
  type?: string
}

// MetaSlider's local and external video slides: an empty div whose `data-sources` list only the
// plugin's Video.js script turns into a player.
export const metasliderMediaResolver: MediaResolver = {
  kind: 'media',
  selector:
    'li.ms-local-video div.local-video[data-sources], li.ms-external-video div.external-video[data-sources]',
  extract: (element) => {
    // The plugin's own lightbox plays the first source.
    const source = jsonAttr<Array<VideoSource>>(element, 'data-sources')?.[0]?.src

    if (!source) {
      return
    }

    return {
      tag: 'video',
      src: source,
      poster: attr(element, 'data-poster'),
    }
  },
}
