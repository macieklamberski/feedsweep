import { isPlainObject, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { readPixels } from '../utils/hints.js'
import { composeQuery, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'puzzleme'

// The apex and `www.` 301 a `/pmm/` url onto `puzzleme.`, and other subdomains serve their own
// players under other paths.
const amuselabsHost = 'amuselabs.com'

// `/pmm/{kind}`, where the kind names the game. Any kind the server knows plays the puzzle the
// id and set name, and one it does not know answers 404.
const playerPathRegex = /^\/pmm\/([^/]+)$/

// A PuzzleMe puzzle, which the player finds by its id within the publisher's set.
const puzzlemeResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const kind = parsed?.pathname.match(playerPathRegex)?.[1]
  const id = parsed?.searchParams.get('id')
  const set = parsed?.searchParams.get('set')

  if (!kind || !id || !set) {
    return
  }

  const page = `https://puzzleme.amuselabs.com/pmm/${kind}${composeQuery({ id, set })}`

  return {
    provider,
    id: `${set}/${id}`,
    // `embed=1` turns the page into the embedded player, without the site's own chrome.
    src: `${page}&embed=1`,
    url: page,
    title: attr(element, 'title'),
  }
}

export const puzzlemeEmbedResolver = createUrlEmbedResolver([amuselabsHost], puzzlemeResolveEmbed)

// The player posts its rendered height unasked, as `{ sentinel: 'amp', type: 'embed-size',
// height }`, again whenever its layout changes.
export const readPuzzlemeHeight = (data: unknown): number | undefined => {
  return isPlainObject(data) && data.type === 'embed-size' ? readPixels(data.height) : undefined
}

export const puzzlemeRenderHint: EmbedRenderHint = {
  provider,
  origin: 'https://puzzleme.amuselabs.com',
  readHeight: readPuzzlemeHeight,
}
