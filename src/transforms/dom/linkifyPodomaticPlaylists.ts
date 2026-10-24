import { getSubdomain } from 'trousse'
import type { DomTransform } from '../../types.js'
import { flashVar } from '../../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../../utils/urls.js'
import { createLink, readCarrierUrl } from '../../utils/widgets.js'

const podomaticHost = 'podomatic.com'
const playerPath = '/swf/jwplayer'
const playlistPath = '/mrss_stream.xml'

const playerSelector = [
  `embed[src*="${podomaticHost}${playerPath}" i]`,
  `object[data*="${podomaticHost}${playerPath}" i]`,
].join(', ')

const readSubdomain = (url: string | undefined): string | undefined => {
  if (!url) {
    return
  }

  const sub = getSubdomain(url, podomaticHost)

  if (sub === 'www') {
    return
  }

  return sub
}

// Podomatic's Flash JW Player set to a podcast's whole feed, `file={sub}.podomatic.com/
// mrss_stream.xml`. Flash no longer runs, so it renders nothing, and the playlist's episodes are
// played only by a player keyed on a numeric podcast id, so the podcast's page is linked instead.
export const linkifyPodomaticPlaylists: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll(playerSelector)) {
    const player = parseUrlOnHosts(readCarrierUrl(element), podomaticHost)

    if (!player?.pathname.startsWith(playerPath)) {
      continue
    }

    const file = flashVar(element, 'file')

    if (parseUrlOnHosts(file, podomaticHost)?.pathname !== playlistPath) {
      continue
    }

    const sub = readSubdomain(file) ?? readSubdomain(flashVar(element, 'viral.link'))

    if (!sub) {
      continue
    }

    const url = `https://www.podomatic.com/podcasts/${encodePathSegment(sub)}`

    element.replaceWith(createLink(document, url))
  }
}
