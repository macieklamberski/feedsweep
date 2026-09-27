import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  applyTones,
  getFileStem,
  glyphFromCodepoints,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

const hosts = [
  'githubassets.com/images/icons/emoji/', // GitHub README scrapings.
  'assets.github.com/images/icons/emoji/', // GitHub's pre-2018 asset host; seen in archived feeds.
  'assets-cdn.github.com/images/icons/emoji/', // GitHub's asset CDN before githubassets.com.
]

// GitHub's gemoji images, from READMEs and issues pasted into a post.
export const githubImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    // A file outside `unicode/` is named by its gemoji name, like `arrow_up.png`, and the alt
    // repeats that name, so neither is read as a code an author typed.
    const stem = getFileStem(element.getAttribute('src') ?? '')
    const glyph = glyphFromCodepoints(stem) ?? glyphFromGemojiName(stem)

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}

// GitHub's emoji element from rendered markdown, holding the glyph with its gemoji name in alias.
// Some feeds garble or drop the glyph, and fallback-src still names its codepoint. The skin tone
// sits in `tone`, which the element applies to the glyph in the browser.
export const githubElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'g-emoji',
  extract: (element) => {
    const fallbackSrc = attr(element, 'fallback-src')
    const glyph = fallbackSrc ? glyphFromCodepoints(getFileStem(fallbackSrc)) : undefined
    const alias = attr(element, 'alias')
    const tone = attr(element, 'tone')
    const shortcode = alias ? `:${alias}:` : undefined
    const result = resolveEmojiElement(element, {
      glyph: glyph ?? glyphFromGemojiName(alias),
      shortcode,
    })

    if (!tone || !result || !('glyph' in result)) {
      return result
    }

    return { glyph: applyTones(result.glyph, tone) }
  },
}
