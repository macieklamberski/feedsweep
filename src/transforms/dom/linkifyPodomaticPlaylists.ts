import { encodePathSegment, getSubdomain, startsWithAnyOf } from 'trousse'
import type { DomTransform } from '../../types.js'
import { flashVar } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createLink, readCarrierUrl } from '../../utils/widgets.js'

const podomaticHost = 'podomatic.com'

// Each Flash show player, and the flashvar naming its podcast's whole playlist.
const players = [
  { path: '/swf/jwplayer', flashVar: 'file', playlistRegex: /^\/mrss_stream\.xml$/i },
  { path: '/swf/joe_multiplayer', flashVar: 'jsonLocation', playlistRegex: /^\/embed\/multi\//i },
  { path: '/flash/flashcatcher', flashVar: 'playlist_url', playlistRegex: /^\/xspf\.xspf$/i },
]

const playerSelector = players
  .flatMap(({ path }) => {
    return [`embed[src*="${podomaticHost}${path}" i]`, `object[data*="${podomaticHost}${path}" i]`]
  })
  .join(', ')

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

// Podomatic's Flash show players, each naming a podcast's whole playlist: the JW Player's
// `file={sub}.podomatic.com/mrss_stream.xml`, the multiplayer's `jsonLocation` on
// `{sub}.podomatic.com/embed/multi/` and the flashcatcher's `playlist_url={sub}.podomatic.com/
// xspf.xspf`. Flash no longer runs, so they render nothing, and the playlist's episodes are played
// only by a player keyed on a numeric podcast id, so the podcast's page is linked instead.
export const linkifyPodomaticPlaylists: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll(playerSelector)) {
    const pathname = parseUrlOnHosts(readCarrierUrl(element), podomaticHost)?.pathname
    const player = players.find(({ path }) => startsWithAnyOf(pathname, path))

    if (!player) {
      continue
    }

    const playlist = flashVar(element, player.flashVar)
    const playlistPath = parseUrlOnHosts(playlist, podomaticHost)?.pathname

    if (!playlistPath || !player.playlistRegex.test(playlistPath)) {
      continue
    }

    const sub = readSubdomain(playlist) ?? readSubdomain(flashVar(element, 'viral.link'))

    if (!sub) {
      continue
    }

    const url = `https://www.podomatic.com/podcasts/${encodePathSegment(sub)}`

    element.replaceWith(createLink(document, url))
  }
}
