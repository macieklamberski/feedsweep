import type { EmojiResolver } from '../types.js'
import { attr, isElement, isWhitespaceText } from '../utils/dom.js'
import {
  getFileStem,
  glyphFromCodepoints,
  glyphFromShortcode,
  isEmojiShaped,
  noEmojiNames,
  resolveEmojiElement,
  resolveEmojiImage,
  withEmojiPresentation,
} from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'

const hosts = [
  'fbcdn.net/images/emoji.php/', // The static CDN
  'www.facebook.com/images/emoji.php/', // The same files from the main host, in older pastes
  'static.cdninstagram.com/images/emoji.php/', // The same files from Instagram's static host
]

// The emoji images a pasted Facebook post ships.
export const facebookEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}

const emojiPath = '/images/emoji.php/'
// The CDN serves from subdomains like `static.xx.fbcdn.net`, older pastes from the main host.
const emojiHosts = ['fbcdn.net', 'www.facebook.com', 'fbstatic-a.akamaihd.net']
// The host is read up to the path, not parsed, since pasted styles mangle the scheme, as in
// `https: //static.xx.fbcdn.net/…`.
const emojiHostRegex = /\/\/([a-z0-9.-]+)\/images\/emoji\.php\//i

// A pasted post's emoji as an empty span or `i` painted with the same file as its background,
// which renders blank once the site's CSS is gone.
export const facebookElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `span[style*="${emojiPath}" i], i[style*="${emojiPath}" i]`,
  extract: (element) => {
    const url = bgImage(element)
    const host = url?.match(emojiHostRegex)?.[1].toLowerCase()

    if (!url || !host) {
      return
    }

    if (!emojiHosts.some((emojiHost) => host === emojiHost || host.endsWith(`.${emojiHost}`))) {
      return
    }

    const text = element.textContent?.trim()

    if (text) {
      if (!isEmojiShaped(text)) {
        return
      }

      return { glyph: text }
    }

    const glyph = glyphFromCodepoints(getFileStem(url).toLowerCase())

    return glyph ? { glyph } : { image: url }
  },
}

// The code Facebook's chat turned into each classic emoticon, by the class suffix it painted.
const classicCodes: Record<string, string> = {
  smile: ':)',
  frown: ':(',
  tongue: ':P',
  grin: ':D',
  gasp: ':O',
  wink: ';)',
  glasses: '8-)',
  sunglasses: '8|',
  grumpy: '>:(',
  unsure: ':/',
  cry: ":'(",
  devil: '3:)',
  angel: 'O:)',
  kiss: ':*',
  heart: '<3',
  squint: '-_-',
  confused: 'o.O',
  upset: '>:O',
  pacman: ':v',
  colonthree: ':3',
  kiki: '^_^',
  like: '(y)',
  robot: ':|]',
  shark: '(^^^)',
  penguin: '<(")',
  putnam: ':putnam:',
  42: ':42:',
  poop: ':poop:',
}

const classicNames = Object.keys(classicCodes)
// Only Facebook's own names, since other widgets name classes like `emoticon_box` the same way.
const classicClassRegex = new RegExp(`(?:^|\\s)emoticon_(${classicNames.join('|')})(?:\\s|$)`)
const textClassSelector = 'span[class~="emoticon_text"]'
const hiddenCodeSelector = 'span[class~="_4mcd"]'

// The words around the name in the label Facebook wrote for screen readers, in the languages
// seen in pasted posts: `smile emoticon`, `winkhymiö`, `Emotikon grin`, `Uttrykksikonet heart`.
const labelPrefixes = 'emoticon|emotikon|emoticón|émoticône|uttrykksikonet'

// Facebook's classic emoticon, an empty span painted from a sprite sheet the feed does not load,
// with the code in its title. The class also rides on spans pasted around whole paragraphs.
export const facebookClassicEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: classicNames.map((name) => `span[class~="emoticon_${name}"]`).join(', '),
  extract: (element) => {
    const name = attr(element, 'class')?.match(classicClassRegex)?.[1]

    // The class also rides on wrappers around pictures, which replacing would delete.
    if (!name || element.querySelector(':not(span)')) {
      return
    }

    const title = attr(element, 'title')
    const code = classicCodes[name]
    const text = element.textContent?.trim()

    if (text && text !== title && text !== code) {
      return
    }

    const glyph = glyphFromShortcode(title) ?? glyphFromShortcode(code)

    // The sibling Facebook hid from sighted readers holds the code, or a label naming the
    // emoticon like `smile emoticon` or `winkhymiö`.
    let previous = element.previousSibling

    while (previous && isWhitespaceText(previous)) {
      previous = previous.previousSibling
    }

    const fallback =
      isElement(previous) && previous.matches(textClassSelector) ? previous.textContent?.trim() : ''

    if (previous && fallback) {
      if (!glyph) {
        return
      }

      // Prose pasted into the class, like `er jeg å fornøyd med :D` or `Big heart for you`, is
      // neither.
      const isCode = glyphFromShortcode(fallback) === glyph
      const labelRegex = new RegExp(
        `^(?:${name} emoticon|${name}hymiö|(?:${labelPrefixes}) ${name})$`,
        'i',
      )
      const isLabel = labelRegex.test(fallback)

      if (!isCode && !isLabel) {
        return
      }

      previous.remove()

      return { glyph }
    }

    // A later paste puts the hidden code after the emoticon instead.
    const next = element.nextElementSibling

    if (glyph && next?.matches(hiddenCodeSelector) && next.textContent?.trim() === code) {
      next.remove()
    }

    return resolveEmojiElement(element, { glyph, shortcode: title ?? code ?? name })
  },
}

// The classic name inside a label Facebook translated around it, like `„smile“-Emoticon`,
// `Смайлик «smile»` or `smilehymiö`.
const labelNameRegex = new RegExp(`(?:^|[^a-z])(${classicNames.join('|')})(?:hymiö|[^a-z]|$)`, 'i')

// The span Facebook hid from sighted readers beside an emoji image, holding its code or glyph.
const hiddenTextSelector = 'span[class~="_7oe"]'
// The empty `i` painted from a sprite sheet the feed does not load.
const spriteSelector = 'i[class~="_4-k1"]'
// The span holding the code at zero size beside the sprite.
const zeroSizeSelector = 'span[class~="_skr"], span[class~="_4mcd"]'

// A later chat markup of the classic emoticon: an empty span or `i` painted by Facebook's CSS, or
// one holding a painted sprite, its code at zero size, or both, named by the screen-reader label
// in its title. A post's wrapper holds the emoji image instead, beside the hidden span, which
// shows once the site's CSS is gone.
export const facebookLabelEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class~="_47e3"], i[class~="_1gwo"][title], i[class~="_lew"][title]',
  extract: (element) => {
    const children = Array.from(element.children)
    const [image, hidden, ...rest] = children
    const isImageWrapper =
      image?.matches('img') &&
      (!hidden || hidden.matches(hiddenTextSelector)) &&
      !rest.length &&
      element.textContent?.trim() === (hidden?.textContent?.trim() ?? '')

    if (isImageWrapper) {
      const result = facebookEmojiResolver.extract(image)

      return result && 'glyph' in result ? result : undefined
    }

    // Some pastes drop the sprite and keep only the zero-size span.
    const sprite = image?.matches(spriteSelector) ? image : undefined
    const [zeroSize, ...after] = sprite ? children.slice(1) : children
    const isSpriteEmpty = !sprite || (!sprite.firstElementChild && !sprite.textContent?.trim())
    const isLabelWrapper =
      (sprite || zeroSize?.matches(zeroSizeSelector)) && isSpriteEmpty && !after.length

    // The class also rides on spans pasted around prose.
    if (!isLabelWrapper && (element.textContent?.trim() || element.firstElementChild)) {
      return
    }

    const name = attr(element, 'title')?.match(labelNameRegex)?.[1].toLowerCase()

    if (!name) {
      return
    }

    const code = classicCodes[name]
    const glyph = glyphFromShortcode(code)

    if (zeroSize) {
      const hiddenImage = zeroSize.querySelector('img')
      const hiddenText =
        zeroSize.textContent?.trim() || (hiddenImage ? attr(hiddenImage, 'alt') : undefined)
      const isCode = hiddenText === code || (!!glyph && glyphFromShortcode(hiddenText) === glyph)
      const isGlyph =
        !!glyph &&
        !!hiddenText &&
        withEmojiPresentation(hiddenText) === withEmojiPresentation(glyph)

      if (hiddenText && !isCode && !isGlyph) {
        return
      }
    }

    return resolveEmojiElement(element, { glyph, shortcode: code })
  },
}
