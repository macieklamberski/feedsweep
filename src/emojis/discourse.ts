import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { getFileStem, resolveEmojiImage } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

// The emoji sets a Discourse site can pick, each served from `/images/emoji/<set>/`. A custom
// emoji is an upload under `/uploads/` instead.
const sets = [
  'apple',
  'emoji_one',
  'facebook_messenger',
  'fluentui',
  'google',
  'google_classic',
  'noto',
  'twemoji',
  'twitter',
  'win10',
]

// Names Discourse draws as another glyph than gemoji, from its own `emojis.json` and `aliases.json`.
// See: https://github.com/discourse/discourse-emojis/tree/29ebe49dee08fcb921e2530ed7718e3236f802a7/dist.
const discourseNames = toMap<string>({
  relaxed: '😌',
  frowning: '☹️',
  bow: '🙇‍♂️',
  policeman: '👮',
  guardsman: '💂',
  bride_with_veil: '👰',
  massage: '💆‍♀️',
  runner: '🏃‍♂️',
  dancing_women: '👯',
  rowboat: '🚣‍♂️',
  swimmer: '🏊‍♂️',
  bicyclist: '🚴‍♂️',
  mountain_bicyclist: '🚵‍♂️',
  kiss: '💏',
  couplekiss: '👩‍❤️‍💋‍👨',
  couple_with_heart: '👩‍❤️‍👨',
  feet: '👣',
  dog: '🐕',
  cat: '🐈',
  tiger: '🐅',
  horse: '🐎',
  cow: '🐄',
  pig: '🐖',
  camel: '🐪',
  mouse: '🐁',
  rabbit: '🐇',
  whale: '🐋',
  whale2: '🐳',
  parasol_on_ground: '🏖️',
  post_office: '🏤',
  train: '🚆',
  boat: '🛥️',
  satellite: '🛰️',
  moon: '🌑',
  umbrella: '☂️',
  snowman: '☃️',
  sunglasses: '🕶️',
  pencil: '✏️',
  calendar: '📅',
  sa: '🈶',
  japan: '🇯🇵',
})

const queryOrHashRegex = /[?#]/
// A toned file is named by its Fitzpatrick type, 2 to 6, inside a folder named for the emoji.
const toneRegex = /^[2-6]$/
const firstModifier = 0x1f3fb // U+1F3FB, Fitzpatrick type 1-2

// See: https://github.com/discourse/discourse/blob/main/app/models/emoji.rb, for the tone.
const getGlyph = (src: string): string | undefined => {
  const path = src.split(queryOrHashRegex)[0]
  const stem = getFileStem(path)
  const isToned = toneRegex.test(stem)
  const name = isToned ? getFileStem(path.slice(0, path.lastIndexOf('/'))) : stem
  const glyph = discourseNames.get(name) ?? glyphFromGemojiName(name)

  if (!glyph || !isToned) {
    return glyph
  }

  // The modifier follows the first codepoint and replaces a variation selector there.
  const [first, ...rest] = [...glyph]
  const tail = rest[0] === '️' ? rest.slice(1) : rest
  const modifier = String.fromCodePoint(firstModifier + Number(stem) - 2)

  return [first, modifier, ...tail].join('')
}

// Discourse's stock emoji, named by the shortcode Discourse writes, a gemoji name or its own.
export const discourseEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: sets.map((set) => `img[class~="emoji" i][src*="/images/emoji/${set}/" i]`).join(', '),
  extract: (element) => {
    const glyph = getGlyph(element.getAttribute('src') ?? '')

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
