import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'flipsnack'

const flipsnackHosts = ['cdn.flipsnack.com', 'files.flipsnack.com', 'player.flipsnack.com']
const playerHost = 'player.flipsnack.com'

// The routes that name the item hash in `hash`, on `cdn.flipsnack.com` and `files.flipsnack.com`.
const itemHashPaths = [
  '/widget/v2/widget.html',
  '/widget/v2/flipsnackwidget.html',
  '/widget/flipsnackwidget.html',
  '/iframe/embed.html', // Flash era, renders a blank page
]

const widgetHeight = 480

// The player's `hash` is the base64 of `{accountId}+{itemHash}`.
const decodePlayerHash = (hash: string): string | undefined => {
  try {
    return atob(hash).split('+')[1]
  } catch {}
}

const readItemHash = (parsed: URL): string | undefined => {
  const hash = parsed.searchParams.get('hash') ?? ''

  if (parsed.hostname === playerHost) {
    if (parsed.pathname !== '/') {
      return
    }

    return decodePlayerHash(hash)
  }

  if (!itemHashPaths.includes(parsed.pathname)) {
    return
  }

  return hash
}

// Flipsnack's flipbook player at `player.flipsnack.com`, the widget at `cdn.flipsnack.com` and the
// Flash-era frame at `files.flipsnack.com` all mint onto widget v2, which plays every item.
const flipsnackResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  const itemHash = readItemHash(parsed)

  if (!itemHash) {
    return
  }

  return {
    provider,
    id: itemHash,
    src: `https://cdn.flipsnack.com/widget/v2/widget.html${composeQuery({ hash: itemHash })}`,
    height: widgetHeight,
    title: attr(element, 'title'),
  }
}

export const flipsnackEmbedResolver = createUrlEmbedResolver(flipsnackHosts, flipsnackResolveEmbed)
