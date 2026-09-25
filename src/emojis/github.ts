import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  getFileStem,
  glyphFromCodepoints,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

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
    const resolved = resolveEmojiImage(element, { isStrong: false, names: noEmojiNames })

    if (resolved) {
      return resolved
    }

    // A file outside `unicode/` is named by its gemoji name, like `arrow_up.png`.
    const glyph = glyphFromEmojiName(getFileStem(element.getAttribute('src') ?? ''))

    return glyph ? { glyph } : { custom: true }
  },
}

// GitHub's emoji element from rendered markdown, holding the glyph with its gemoji name in alias.
// Some feeds garble or drop the glyph, and fallback-src still names its codepoint.
export const githubElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'g-emoji',
  extract: (element) => {
    const fallbackSrc = attr(element, 'fallback-src')
    const glyph = fallbackSrc ? glyphFromCodepoints(getFileStem(fallbackSrc)) : undefined
    const alias = attr(element, 'alias')

    return resolveEmojiElement(element, {
      glyph: glyph ?? glyphFromEmojiName(alias),
      shortcode: alias ? `:${alias}:` : undefined,
    })
  },
}
