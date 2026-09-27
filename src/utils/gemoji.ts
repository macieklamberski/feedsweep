import { gemoji } from 'gemoji'

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

// A gemoji or CLDR emoji name, bare or in colons, for an engine that names files by them.
export const glyphFromGemojiName = (name: string | undefined): string | undefined => {
  const key = name?.replace(colonsRegex, '').toLowerCase() ?? ''

  return getGemojiNames().get(key)
}
