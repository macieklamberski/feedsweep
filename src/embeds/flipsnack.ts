import { composeQuery, getQueryParam, isAnyOf, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'flipsnack'

const hosts = ['cdn.flipsnack.com', 'files.flipsnack.com', 'player.flipsnack.com']
const playerHosts = ['player.flipsnack.com']

// The routes that name the item hash in `hash`, on `cdn.flipsnack.com` and `files.flipsnack.com`.
const itemHashPaths = [
  '/widget/v2/widget.html',
  '/widget/v2/flipsnackwidget.html',
  '/widget/flipsnackwidget.html',
  '/iframe/embed.html', // Flash era, renders a blank page
]

const sizes = {
  widget: { height: 480 },
}

// The player's `hash` is the base64 of `{accountId}+{itemHash}`.
const decodePlayerHash = (hash: string): string | undefined => {
  try {
    return atob(hash).split('+')[1]
  } catch {}
}

const readItemHash = (parsed: URL): string | undefined => {
  const hash = getQueryParam(parsed.searchParams, 'hash') ?? ''

  if (isHostOf(parsed, playerHosts)) {
    if (parsed.pathname !== '/') {
      return
    }

    return decodePlayerHash(hash)
  }

  if (!isAnyOf(parsed.pathname, itemHashPaths)) {
    return
  }

  return hash
}

// Flipsnack's flipbook player at `player.flipsnack.com`, the widget at `cdn.flipsnack.com` and the
// Flash-era frame at `files.flipsnack.com` all mint onto widget v2, which plays every item.
const flipsnackResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const itemHash = readItemHash(url)

  if (!itemHash) {
    return
  }

  return {
    provider,
    id: itemHash,
    src: `https://cdn.flipsnack.com/widget/v2/widget.html${composeQuery({ hash: itemHash })}`,
    ...sizes.widget,
    title: attr(element, 'title'),
  }
}

export const flipsnackEmbedResolver = createUrlEmbedResolver(hosts, flipsnackResolveEmbed)
