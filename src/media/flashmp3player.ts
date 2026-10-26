import { getQueryParam } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const hosts = ['flash-mp3-player.net']

// The Flash MP3 Player widget, an `<object>` or `<embed>` whose `.swf` on flash-mp3-player.net
// answers 404, so it renders nothing.
export const flashMp3PlayerMediaResolver: MediaResolver = {
  kind: 'media',
  selector: hosts
    .flatMap((host) => {
      return [`embed[src*="${host}/medias/" i]`, `object[data*="${host}/medias/" i]`]
    })
    .join(', '),
  extract: (element) => {
    const parsed = parseUrlOnHosts(readCarrierUrl(element), hosts)

    if (!parsed) {
      return
    }

    const source = flashVar(element, 'mp3') ?? getQueryParam(parsed.searchParams, 'mp3')

    if (!source) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
