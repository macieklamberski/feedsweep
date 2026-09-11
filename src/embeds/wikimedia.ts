import { parseUrl } from 'trousse'
import type { EmbedResolver, EmbedResolverResult } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  decodeOrKeep,
  isMediaWikiFilePage,
  parseMediaWikiFileName,
  placeholderBaseUrl,
  videoFileRegex,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, readCarrierUrl } from '../utils/widgets.js'

const extensionRegex = /\.[^.]+$/
const underscoreRegex = /_/g

// The same address without it answers with the file's description page, 101 KB of navigation and
// licensing against the player's 7 KB.
const playerParam = 'embedplayer=yes'

// `Special:FilePath` snaps a width to a fixed set and serves a request for 640 at 960. A width on
// an audio file answers with a generic 3 KB icon rather than the file, so only video asks for one.
const posterWidth = 960

// Commons spells a name `Amy_Johnson_England_to_Australia_Solo_Flight,_1930.webm`.
export const composeFileTitle = (fileName: string): string | undefined => {
  return decodeOrKeep(fileName)?.replace(extensionRegex, '').replace(underscoreRegex, ' ')
}

// `Special:FilePath/{name}` redirects to the file itself, keyed on the name alone, with no
// signature and no expiry. The wiki that framed the file serves it whether or not the upload
// lives on Commons, so the origin comes from the carrier rather than from a fixed host.
export const composeFilePathUrl = (
  url: string,
  fileName: string,
  width?: number,
): string | undefined => {
  const origin = parseUrl(url, placeholderBaseUrl)?.origin
  const query = width ? `?width=${width}` : ''

  return origin && `${origin}/wiki/Special:FilePath/${fileName}${query}`
}

const composePlayerUrl = (url: string): string => {
  return url.includes(playerParam) ? url : `${url}${url.includes('?') ? '&' : '?'}${playerParam}`
}

// MediaWiki's TimedMediaHandler frames its own player for a freely licensed file, and that player
// carries the subtitles and the attribution the raw file does not.
export const wikimediaEmbedResolver: EmbedResolver = createMarkupEmbedResolver(
  'iframe',
  (element): EmbedResolverResult | undefined => {
    const source = readCarrierUrl(element)

    if (!source || !isMediaWikiFilePage(source) || !videoFileRegex.test(source)) {
      return
    }

    const fileName = parseMediaWikiFileName(source)

    if (!fileName) {
      return
    }

    const result: EmbedResolverResult = {
      provider: 'wikimedia',
      id: fileName,
      src: composePlayerUrl(source),
      // Commons carries a lot of 4:3 archive footage, so this stands only where the frame
      // declares no size of its own.
      ratio: '16/9',
    }

    const thumbnail = composeFilePathUrl(source, fileName, posterWidth)

    if (thumbnail) {
      result.thumbnail = thumbnail
    }

    const title = attr(element, 'title') ?? composeFileTitle(fileName)

    if (title) {
      result.title = title
    }

    return result
  },
)
