import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { type EmojiGlyph, rendersNothing, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smilieSelector, smiliesEmojiNames } from './smilies.js'

const directory = '/xenforo/smilies/'
// XenForo 1.x paints its smilie sprite behind this transparent file.
const spacerPath = 'xenforo/clear.png'
const markerSelector = [
  'img[class^="mcesmilie" i]', // XenForo 1.x numbers them, as in `mceSmilieSprite mceSmilie7`
  'img[class*=" mcesmilie" i]',
].join(', ')

// XenForo boards' additions to the stock set.
const xenforoEmojiNames = toMap<EmojiGlyph>({
  happy: false,
  wave: false,
  banghead: false,
  angelic: false,
  woot: false,
  dance: false,
  welcome: false,
  '1': false,
})

// XenForo's smilies, and the CSS sprites it paints behind a blank image named by data-shortname,
// which render as nothing without the site's CSS.
export const xenforoEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, img[data-shortname], img[src*="${directory}" i], img[src*="${spacerPath}" i]`,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const shortname = attr(element, 'data-shortname')
    const isBlank = src.endsWith(spacerPath)
    const isSprite = !!shortname && (isBlank || rendersNothing(src))
    // Some feeds drop the class, and the spacer alone still names the engine.
    const isStrong = isSprite || isBlank || element.matches(markerSelector)

    if (!isStrong && !element.matches(smilieSelector)) {
      return
    }

    const glyph = getDirectoryGlyph(src, directory, xenforoEmojiNames)

    return resolveEmojiImage(element, { isStrong, names: smiliesEmojiNames, glyph, isBlank })
  },
}
