import { parseUrl } from 'trousse'
import type { MediaResolver, MediaResolverResult } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { flashFileRegex, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

// Weebly's own copy and the copy archive.org items host have resolvers of their own.
const claimedHosts = ['weebly.com', 'archive.org']

const httpUrlRegex = /^https?:\/\//i
const embedCallRegex = /AudioPlayer\.embed\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g
const soundFileOptionRegex = /\bsoundFile\s*:\s*(["'])(.*?)\1/
const titlesOptionRegex = /\btitles\s*:\s*(["'])(.*?)\1/

// See: https://plugins.svn.wordpress.org/audio-player/tags/2.0.4.6/audio-player.php.
// `encodeSource` writes the file list as unpadded base64url, plus a stray `A` when the bit count
// is a multiple of six, which leaves a length `atob` refuses. A plain url's `:` fails `atob` too.
const decodeSource = (value: string): string => {
  const trimmed = value.length % 4 === 1 ? value.slice(0, -1) : value

  try {
    const binary = atob(trimmed.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

    return new TextDecoder().decode(bytes)
  } catch {
    return value
  }
}

// The player splits `soundFile` and `titles` on commas into a playlist and starts at the first.
const composeAudio = (
  soundFile: string | undefined,
  titles: string | undefined,
): MediaResolverResult | undefined => {
  const src = soundFile ? decodeSource(soundFile).split(',')[0] : undefined

  if (!src || !httpUrlRegex.test(src)) {
    return
  }

  return {
    tag: 'audio',
    src,
    title: titles?.split(',')[0],
  }
}

// The 1 Pixel Out audio player, a `.swf` any publisher can host, which names its file in the
// `soundFile` flashvar or the swf url's query. Flash no longer runs, so the bar renders nothing.
export const onePixelOutFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'object[data*=".swf" i], embed[src*=".swf" i]',
  extract: (element) => {
    const carrierUrl = readCarrierUrl(element)
    const player = parseUrl(carrierUrl, placeholderBaseUrl)

    if (!player || !flashFileRegex.test(player.pathname)) {
      return
    }

    if (parseUrlOnHosts(carrierUrl, claimedHosts)) {
      return
    }

    const soundFile = flashVar(element, 'soundFile') ?? player.searchParams.get('soundFile')

    return composeAudio(soundFile ?? undefined, flashVar(element, 'titles'))
  },
}

// Version 2 of the WordPress plugin writes a `<p id="audioplayer_N">` holding fallback text, and
// an `AudioPlayer.embed` call naming that id swaps it for the player.
export const onePixelOutWidgetMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'p[id^="audioplayer_"]',
  extract: (element) => {
    // Some copies also write a native player into the mount for browsers without Flash.
    if (element.querySelector('audio, video')) {
      return
    }

    // The call sits in a script beside the mount, or beside a wrapper around it.
    for (const script of element.ownerDocument.querySelectorAll('script')) {
      for (const [, id, options] of script.textContent?.matchAll(embedCallRegex) ?? []) {
        if (id !== element.id) {
          continue
        }

        const soundFile = options?.match(soundFileOptionRegex)?.[2]
        const titles = options?.match(titlesOptionRegex)?.[2]

        return composeAudio(soundFile, titles)
      }
    }
  },
}
