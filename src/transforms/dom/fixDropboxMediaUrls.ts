import type { DomTransform } from '../../types.js'
import { parseUrlOnHosts } from '../../utils/urls.js'

const dropboxHosts = ['dropbox.com']

// The share routes: `/s/{token}/{file}` and the current `/scl/fi/{token}/{file}`.
const sharePathRegex = /^\/+(?:s|scl\/fi)\//

// A Dropbox share url serves the HTML preview page for every query form but `raw=1`, so a media
// element pointed at one plays nothing. `dl=1` wins over `raw=1` and has to go.
export const fixDropboxMediaUrls: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('audio[src], video[src], source[src]')) {
    const url = parseUrlOnHosts(element.getAttribute('src') ?? undefined, dropboxHosts)

    if (!url || !sharePathRegex.test(url.pathname)) {
      continue
    }

    url.searchParams.delete('dl')
    url.searchParams.set('raw', '1')

    element.setAttribute('src', url.href)
  }
}
