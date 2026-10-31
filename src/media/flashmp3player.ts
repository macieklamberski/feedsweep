import { getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { cleanCarrierUrl, pluginCarrierSelector, readCarrierUrlOnHosts } from '../utils/widgets.js'

const hosts = ['flash-mp3-player.net']

// The Flash MP3 Player widget, an `<object>` or `<embed>` whose `.swf` on flash-mp3-player.net
// answers 404, so it renders nothing.
export const flashMp3PlayerMediaResolver: MediaResolver = {
  kind: 'media',
  selector: pluginCarrierSelector,
  extract: (element, context) => {
    const parsed = readCarrierUrlOnHosts(element, hosts, context)

    if (!parsed) {
      return
    }

    const [route] = getPathSegments(parsed)

    if (!isAnyOf(route, 'medias')) {
      return
    }

    const declared = flashVar(element, 'mp3') ?? getQueryParam(parsed.searchParams, 'mp3')
    const source = cleanCarrierUrl(element, declared, context)

    if (!source) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
