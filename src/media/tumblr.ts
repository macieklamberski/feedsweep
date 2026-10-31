import { getQueryParam, parseUrl } from 'trousse'
import type { MediaResolver } from '../types.js'
import { audioFileRegex, placeholderBaseUrl } from '../utils/urls.js'
import { readRepairedCarrierUrl } from '../utils/widgets.js'

// A Tumblr audio post frames its player page, which a native <audio> cannot play. The page url
// names the file in its `audio_file` query value, so the file plays as the native element.
export const tumblrMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'iframe.tumblr_audio_player',
  extract: (element, context) => {
    const parsed = parseUrl(readRepairedCarrierUrl(element, context), placeholderBaseUrl)
    const file = getQueryParam(parsed?.searchParams, 'audio_file')

    if (!file || !audioFileRegex.test(file)) {
      return
    }

    return { tag: 'audio', src: file }
  },
}
