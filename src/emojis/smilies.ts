import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import {
  type EmojiGlyph,
  type EmojiNameTable,
  getNameStem,
  mergeEmojiNames,
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
      whatchutalkingabout_smile: false, // The MSN set's indecision face
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
  'img[class~="e-emoticon" i]', // e107
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
  'SMILIES_PATH', // phpBB's template variable left unsubstituted, raw or percent-encoded
]
const directorySelector = directories.map((path) => `img[src*="${path}" i]`).join(', ')

// The images carrying a class several forum engines share or sitting in a directory they share.
export const smilieSelector = `${markerSelector}, ${directorySelector}`

// An engine's own names, read only under the directory it serves them from, since other engines
// ship other drawings under the same names.
export const getDirectoryGlyph = (
  src: string,
  directory: string,
  names: Map<string, EmojiGlyph>,
): EmojiGlyph | undefined => {
  // A XenForo sprite's base64 can contain `/`, leaving a stem that matches a name by accident.
  if (src.startsWith('data:')) {
    return
  }

  const path = src.toLowerCase()

  if (!path.includes(directory)) {
    return
  }

  return names.get(getNameStem(path))
}

// WoltLab and phpBB boards' additions, both served from `images/smilies/`.
const boardEmojiNames = toMap<EmojiGlyph>({
  smiley34: false,
  danke: false,
  smiley40: false,
  smiley5: false,
  smiley37: false,
  smiley35: false,
  gruebel: false,
  happy: false,
  pleased: false,
  pinch: false,
  smiley41: false,
  smiley47: false,
  pardon: false,
  smiley39: false,
  dance: false,
  smiley44: false,
  cursing: false,
  respekt: false,
  smiley36: false,
  dash: false,
  smiley49: false,
  '3b63d1616c5dfcf29f8a7a031aaa7cad': false, // JForum's stock set, named by hash
  applaus: false,
  party: false,
  smiley38: false,
  pillepalle: false,
  '8': false,
  '14': false,
  squint: false,
  '8a80c6485cd926be453217d59a84a888': false, // JForum's stock set, named by hash
  '283a16da79f3aa23fe1025c96295f04f': false, // JForum's stock set, named by hash
  top: false,
  hammer: false,
  '4': false,
  bier: false,
  help: false,
  '9d71f0541cff0a302a0309c5079e8dee': false, // JForum's stock set, named by hash
  b2eb59423fbf5fa39342041237025880: false, // JForum's stock set, named by hash
  smiley50: false,
  welcome: false,
})

// Forum smilie images, which render oversized without the site's CSS. An engine with names or
// signals of its own has a resolver of its own ahead of this one.
export const smiliesEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: smilieSelector,
  extract: (element) => {
    const src = element.getAttribute('src') ?? ''
    const isStrong = element.matches(markerSelector)

    if (!isStrong && !element.matches(directorySelector)) {
      return
    }

    return resolveEmojiImage(element, {
      isStrong,
      names: smiliesEmojiNames,
      glyph: getDirectoryGlyph(src, '/images/smilies/', boardEmojiNames),
    })
  },
}
