import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiGlyph,
  type EmojiNameTable,
  getFileStem,
  getNameStem,
  glyphFromCodepoints,
  mergeEmojiNames,
  rendersNothing,
  resolveEmojiImage,
} from '../utils/emojis.js'

// Each engine lists the filenames its own distribution ships, and `smile.png` is shipped by four.
export const smiliesEmojiNameTables: Array<EmojiNameTable> = [
  {
    name: 'WordPress',
    names: {
      icon_smile: '🙂',
      icon_wink: '😉',
      icon_biggrin: '😁',
      icon_sad: '🙁',
      icon_razz: false,
      icon_cool: '😎',
      icon_lol: '🤣',
      icon_cry: '😢',
      icon_mad: '😠',
      icon_confused: '😕',
      icon_rolleyes: '🙄',
      icon_eek: false,
      icon_surprised: '😲',
      icon_neutral: '😐',
      icon_redface: false,
      icon_evil: false, // An angry devil here, a grinning one on other engines
      icon_twisted: false,
      icon_idea: '💡',
      icon_exclaim: '❗',
      icon_question: '❓',
      icon_mrgreen: false, // The green is the whole joke, so there is nothing to convert it to
    },
  },
  {
    name: 'phpBB',
    names: {
      icon_e_smile: '🙂',
      icon_e_wink: '😉',
      icon_e_biggrin: '😁',
      icon_e_sad: '🙁',
      icon_e_tongue: '😛',
      icon_e_cool: '😎',
      icon_e_confused: '😕',
      icon_e_surprised: '😲',
      icon_e_geek: false,
      icon_e_ugeek: false,
      icon_cool: '😎',
      icon_lol: '🤣',
      icon_mad: '😠',
      icon_razz: false,
      icon_redface: false,
      icon_cry: '😢',
      icon_evil: false,
      icon_twisted: false,
      icon_rolleyes: '🙄',
      icon_eek: false,
      icon_exclaim: '❗',
      icon_question: '❓',
      icon_idea: '💡',
      icon_arrow: '➡️',
      icon_neutral: '😐',
      icon_mrgreen: false,
    },
  },
  {
    name: 'SMF',
    names: {
      smiley: '🙂',
      wink: '😉',
      cheesy: '😁',
      grin: '😁',
      angry: '😠',
      sad: '🙁',
      shocked: '😲',
      cool: '😎',
      huh: false,
      rolleyes: '🙄',
      tongue: '😛',
      embarrassed: '😳',
      lipsrsealed: '🤐',
      undecided: false,
      kiss: '😘',
      cry: '😢',
      evil: false,
      laugh: '🤣',
      angel: '😇',
      // Drawn characters with no Unicode counterpart.
      afro: false,
      azn: false,
      police: false,
    },
  },
  {
    name: 'MyBB',
    names: {
      smile: '🙂',
      wink: '😉',
      cool: '😎',
      biggrin: '😁',
      tongue: '😛',
      rolleyes: '🙄',
      shy: false,
      sad: '🙁',
      angel: '😇',
      angry: '😠',
      blush: false,
      confused: '😕',
      exclamation: '❗',
      heart: '❤️',
      huh: false,
      lightbulb: '💡',
      sleepy: '😴',
      undecided: false,
      cry: '😢',
      sick: false,
      arrow: '➡️',
      at: false, // MyBB-specific oddities with nothing to convert to
      my: false,
      dodgy: false, // A shifty look, between 😏 and 😒 with no clear winner
    },
  },
  {
    name: 'FluxBB and PunBB',
    names: {
      smile: '🙂',
      neutral: '😐',
      sad: '🙁',
      big_smile: '😁',
      yikes: '😱',
      wink: '😉',
      hmm: false,
      tongue: '😛',
      lol: '🤣',
      mad: '😠',
      roll: '🙄',
      cool: '😎',
    },
  },
  {
    name: 'DokuWiki',
    names: {
      cool: '😎',
      eek: false,
      sad: '🙁',
      smile: '🙂',
      smile2: false, // A second smile, whose name does not say which
      doubt: false,
      doubt2: false,
      confused: '😕',
      biggrin: '😁',
      razz: false,
      surprised: '😲',
      silenced: '🤐',
      neutral: '😐',
      wink: '😉',
      facepalm: '🤦',
      fun: false,
      question: '❓',
      exclaim: '❗',
      lol: '🤣',
      // fixme, deleteme: editorial workflow markers shipped alongside the smilies, not emoji.
    },
  },
  {
    name: 'e107',
    names: {
      alien: '👽',
      amazed: '😲',
      angry: '😠',
      biglaugh: '😆',
      cheesey: '😁', // Misspelled in the distribution; keyed as shipped
      suprised: '😲', // Same
      confused: '😕',
      cry: '😢',
      frown: '🙁',
      grin: '😁',
      heart: '❤️',
      idea: '💡',
      mad: '😠',
      neutral: '😐',
      question: '❓',
      rolleyes: '🙄',
      sad: '🙁',
      shades: '😎',
      shy: false,
      smile: '🙂',
      tongue: '😛',
      wink: '😉',
      // No unambiguous counterpart.
      dead: false,
      dodge: false,
      gah: false,
      ill: false,
      mistrust: false,
      special: false,
    },
  },
  {
    name: 'Serendipity',
    names: {
      normal: false, // Its config binds this to `:-|`
      unhappy: '🙁', // And this to `:(`
      haha: '🤣',
      whistle: false,
      shame: false, // Sits between two glyphs already used for near-synonyms
      // anger: the same, and a false entry would stop Vanilla's gemoji anger.png becoming 💢.
      // No Unicode counterpart.
      grmpf: false,
      grrr: false,
      hero: false,
      ko: false,
      safe: false,
      still: false,
    },
  },
  {
    // Keyed without the `16x16_` size prefix, which Vodafone's copy of the set ships as `15x15_`.
    name: 'Khoros and Lithium',
    names: {
      'smiley-happy': '🙂',
      'smiley-wink': '😉',
      'smiley-very-happy': '😁',
      'smiley-tongue': '😛',
      'smiley-sad': '🙁',
      'smiley-mad': '😠',
      'smiley-surprised': '😲',
      'smiley-lol': '🤣',
      'smiley-embarrassed': '😳',
      'smiley-indifferent': '😐',
      heart: '❤️',
      'cat-happy': '😺',
      'cat-very-happy': '😸',
      'cat-lol': '😹',
      'smiley-frustrated': false,
      // Unicode's cat faces stop at the three smiles above.
      'cat-wink': false,
      'cat-tongue': false,
      'cat-embarrassed': false,
      // _woman-*, _man-*, _robot-*: no such faces at all.
    },
  },
  {
    name: 'CKEditor, FCKeditor and TinyMCE',
    names: {
      regular_smile: '🙂',
      teeth_smile: '😁',
      wink_smile: '😉',
      sad_smile: '🙁',
      cry_smile: '😭',
      angry_smile: '😠',
      confused_smile: false,
      omg_smile: '😲',
      shades_smile: '😎',
      angel_smile: '😇',
      devil_smile: false,
      tongue_smile: '😛',
      tounge_smile: '😛', // Misspelled upstream, and four times rarer than the corrected name
      embaressed_smile: '😳', // Same
      embarrassed_smile: '😳',
      broken_heart: '💔',
      envelope: '✉️',
      kiss: '😘',
      lightbulb: '💡',
      thumbs_up: '👍',
      thumbs_down: '👎',
      // TinyMCE 3's names, after its `smiley-` prefix. Vanilla ships the tongue and money faces.
      sealed: '🤐',
      embarassed: '😳', // Misspelled upstream
      'tongue-out': '😛',
      'money-mouth': '🤑',
      'foot-in-mouth': false, // No Unicode counterpart
    },
  },
  {
    name: 'Serendipity, Drupal and Kunena',
    names: {
      unsure: false, // Kunena's, seen at /media/kunena/emoticons/unsure.png
    },
  },
  {
    name: 'Invision Power Board and Kunena',
    names: {
      wub: false,
      blink: false,
      wacko: false,
      ph34r: false,
      w00t: false,
      whistling: false,
      doh: false,
      dry: false,
      mellow: false,
      sleep: '😴',
    },
  },
  {
    // Filenames observed in real feeds whose engine was never pinned down. Kept apart from the
    // lists above so those stay verifiable against a distribution, and this stays honest about
    // being unattributed.
    name: 'observed in feeds, engine not identified',
    names: {
      // Each board draws its own picture for these.
      clap: false,
      thumbup: false,
      thumbdown: false,
      thumbsup: false,
      redface: false,
      innocent: false,
      crying: false,
      santa: false,
      popcorn: false,
      laughing: false,
      ohmy: false,
      dizzy: false,
      love: false,
      devil: false,
      yell: false,
      rofl: false,
      rotfl: false,
      yes: false,
      ok: false,
      good: false,
      hi: false,
      bye: false,
      beer: false,
      crazy: false,
      cheers: false,
      bravo: false,
      mrgreen: false,
      happy: false, // Means :BOL, ;D, XD, :) and ^_^ on different boards
    },
  },
]

export const smiliesEmojiNames = toMap(mergeEmojiNames(smiliesEmojiNameTables))

const markerSelectors = [
  'img[class~="smilies" i]', // phpBB
  'img[class~="smiley" i]', // SMF, DokuWiki
  'img[class~="smilie" i]', // MyBB, XenForo
  'img[class^="mcesmilie" i]', // XenForo 1.x numbers them, as in `mceSmilieSprite mceSmilie7`
  'img[class*=" mcesmilie" i]',
  'img[class~="e-emoticon" i]', // e107
  'img[class~="bbc_emoticon" i]', // Invision Power Board and IPS
  'img[data-emoticon]', // Invision Power Board and IPS
  'img[class~="ipsemoji" i]', // IPS 4
  'img[class~="lia-image-emoji" i]', // Khoros
  // Khoros, as in `emoticon emoticon-smileywink`. Case-sensitive, since Windows Live Writer's
  // `wlEmoticon-smile` has no name table.
  'img[class*="emoticon-"]',
  'img[class~="bbcode_smiley" i]', // Kunena, NBBC
  'img[class~="spsmiley" i]', // Simple:Press
  'img[class~="smiley-content" i]', // Drupal Smileys
  'img[class~="wpml_ico" i]', // WP Monalisa
  'img[class~="bb-smiley" i]', // EasyDiscuss
  'img[smilieid]', // Discuz, vBulletin 5
]
const markerSelector = markerSelectors.join(', ')

const directories = [
  // WordPress, phpBB, MyBB, XenForo, FluxBB, PunBB and Khoros. Cannot be narrowed: both
  // wp-includes and plugin icon sets sit under it, and the theme directory above differs per board.
  '/smilies/',
  '/smileys/', // SMF, DokuWiki's lib/images/smileys/, Drupal
  '/smiles/', // uCoz, and boards that serve phpBB's set from a renamed directory
  '/smiley/', // CKEditor, FCKeditor and TinyMCE; ProBoards serves the same set from here
  '/emotes/', // e107
  '/emoticons/', // Serendipity's stock template set and emoticate plugin, IPS, Kunena
  '/style_emoticons/', // IPB 2 and 3, which the plural form above misses
  'forum-smileys/', // Simple:Press, with no leading slash before the directory
  '/smiley_icons/', // FUDforum
  '/plugins/emotions/img/', // TinyMCE 3
  'SMILIES_PATH', // phpBB's template variable left unsubstituted, raw or percent-encoded
]
const directorySelector = directories.map((path) => `img[src*="${path}" i]`).join(', ')

// Web Wiz Forums numbers its files. WoltLab ships other drawings under the same names in
// `/smilies/`, so these are read only from Web Wiz's `/smileys/`.
const webWizEmojiNames = toMap<EmojiGlyph>({
  smiley1: false,
  smiley2: false,
  smiley3: false,
  smiley4: false,
  smiley5: false,
  smiley6: false,
  smiley7: false,
  smiley8: false,
  smiley9: false,
  smiley10: false,
  smiley11: false,
  smiley12: false,
  smiley13: false,
  smiley14: false,
  smiley15: false,
  smiley16: false,
  smiley17: false,
  smiley18: false,
  smiley19: false,
  smiley20: false,
  smiley21: false,
  smiley22: false,
  smiley23: false,
  smiley24: false,
  smiley25: false,
  smiley26: false,
  smiley27: false,
  smiley28: false,
  smiley29: false,
  smiley30: false,
  smiley31: false,
  smiley32: false,
  smiley33: false,
  smiley34: false,
  smiley35: false,
  smiley36: false,
  smiley37: false,
  smiley38: false,
  smiley39: false,
  smiley40: false,
  smiley41: false,
  smiley42: false,
})

// Discuz! X's names, some as generic as `time` and `call`, so read only from its own directory.
const discuzEmojiNames = toMap<EmojiGlyph>({
  huffy: false,
  titter: false,
  sweat: false,
  loveliness: false,
  funk: false,
  curse: false,
  shutup: false,
  hug: false,
  victory: false,
  time: false,
  handshake: false,
  call: false,
})

// Names each engine ships under its own directory, where other engines ship other drawings.
const engineEmojiNames: Array<[string, Map<string, EmojiGlyph>]> = [
  ['/smileys/', webWizEmojiNames],
  ['static/image/smiley/', discuzEmojiNames],
]

// NBBC's names for the codes the shared table draws as another face: `8)`, `;D`, `:s` and `<_<`.
// Read ahead of the alt, since NBBC writes the code there.
const nbbcEmojiNames = toMap<EmojiGlyph>({
  bigwink: false,
  bigeyes: false,
  worry: false,
  lookleft: false,
})

// XenForo 2's shortnames that other engines draw as another face: `o_O` is skeptical on WP
// Monalisa and a wow face on Menéame, and XenForo draws it dizzy.
const xenforoShortnames = toMap<EmojiGlyph>({
  o_o: false,
})

const getEngineGlyph = (src: string): EmojiGlyph | undefined => {
  // A XenForo sprite's base64 can contain `/`, leaving a stem that matches a name by accident.
  if (src.startsWith('data:')) {
    return
  }

  const path = src.toLowerCase()
  const stem = getNameStem(path)

  for (const [directory, names] of engineEmojiNames) {
    if (path.includes(directory) && names.has(stem)) {
      return names.get(stem)
    }
  }

  return nbbcEmojiNames.get(stem)
}

// Samsung's Khoros set files each face as `<n>.<name>_<codepoints>`, as in `2.winking-face_1f609`,
// and a skin tone appends the modifier's name and codepoint after the full sequence.
const numberedNameRegex = /^[0-9]+\.([a-z-]+)_/

const getNumberedGlyph = (src: string): EmojiGlyph | undefined => {
  const stem = getFileStem(src).toLowerCase()
  const name = stem.match(numberedNameRegex)?.[1]

  if (!name) {
    return
  }

  // Samsung's own smiling face is filed under the codepoint of 🃏.
  if (name === 'samsung') {
    return false
  }

  for (const part of stem.split('_')) {
    const glyph = glyphFromCodepoints(part)

    if (glyph) {
      return glyph
    }
  }
}

// Forum smilie images and CSS-sprite emoji, which render oversized or as nothing without site CSS.
export const smiliesEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, ${directorySelector}, img[data-shortname]`,
  extract: (element) => {
    // XenForo paints its sprite sheet behind a 1x1 transparent GIF named by data-shortname.
    const src = element.getAttribute('src') ?? ''
    const shortname = attr(element, 'data-shortname')?.toLowerCase()
    const isSprite = !!shortname && rendersNothing(src)
    const isStrong = isSprite || element.matches(markerSelector)

    if (!isStrong && !element.matches(directorySelector)) {
      return
    }

    const engineGlyph = getNumberedGlyph(src) ?? getEngineGlyph(src)

    return resolveEmojiImage(element, {
      isStrong,
      names: smiliesEmojiNames,
      glyph: engineGlyph ?? xenforoShortnames.get(shortname ?? ''),
    })
  },
}
