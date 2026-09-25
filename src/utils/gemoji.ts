import { gemoji } from 'gemoji'
import { glyphFromShortcode } from './emojis.js'

const colonsRegex = /^:|:$/g
const combiningMarkRegex = /\p{M}/gu
const nonNameRegex = /[^a-z0-9]+/g
const edgeUnderscoreRegex = /^_|_$/g

let gemojiNames: Map<string, string> | undefined

// The CLDR short name in the snake case Khoros writes: `red heart` is `red_heart`.
const toSnakeCase = (description: string): string => {
  return description
    .normalize('NFKD')
    .replace(combiningMarkRegex, '')
    .toLowerCase()
    .replace(nonNameRegex, '_')
    .replace(edgeUnderscoreRegex, '')
}

// Built on the first lookup, since most content carries no emoji name at all.
const getGemojiNames = (): Map<string, string> => {
  if (gemojiNames) {
    return gemojiNames
  }

  const names = new Map<string, string>()
  // Undefined marks a CLDR name two glyphs share, like `keycap` for both `#` and `*`.
  const cldrNames = new Map<string, string | undefined>()

  for (const { emoji, names: aliases, description } of gemoji) {
    for (const alias of aliases) {
      names.set(alias, emoji)
    }

    const cldrName = toSnakeCase(description)
    const isShared = cldrNames.has(cldrName) && cldrNames.get(cldrName) !== emoji

    cldrNames.set(cldrName, isShared ? undefined : emoji)
  }

  // A gemoji name wins over a CLDR name: `kiss` is 💋 there and 💏 in CLDR.
  for (const [cldrName, emoji] of cldrNames) {
    if (emoji && !names.has(cldrName)) {
      names.set(cldrName, emoji)
    }
  }

  gemojiNames = names

  return names
}

// A gemoji or CLDR emoji name, bare or in colons. The shared shortcode table is read first, so
// a name it already maps keeps the glyph every other engine draws for it.
export const glyphFromEmojiName = (name: string | undefined): string | undefined => {
  const key = name?.replace(colonsRegex, '').toLowerCase()

  if (!key) {
    return
  }

  return glyphFromShortcode(`:${key}:`) ?? getGemojiNames().get(key)
}
