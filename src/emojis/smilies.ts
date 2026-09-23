import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiNameTable,
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
      icon_biggrin: '😃',
      icon_sad: '🙁',
      icon_razz: '😛',
      icon_cool: '😎',
      icon_lol: '😄',
      icon_cry: '😢',
      icon_mad: '😠',
      icon_confused: '😕',
      icon_rolleyes: '🙄',
      icon_eek: '😳',
      icon_surprised: '😲',
      icon_neutral: '😐',
      icon_redface: '😳',
      icon_evil: '👿',
      icon_twisted: '😈',
      icon_idea: '💡',
      icon_exclaim: '❗',
      icon_question: '❓',
      // icon_mrgreen: the green is the whole joke, so there is nothing to convert it to.
    },
  },
  {
    name: 'phpBB',
    names: {
      icon_e_smile: '🙂',
      icon_e_wink: '😉',
      icon_e_biggrin: '😃',
      icon_e_sad: '🙁',
      icon_e_tongue: '😛',
      icon_e_cool: '😎',
      icon_e_confused: '😕',
      icon_e_surprised: '😲',
      icon_e_geek: '🤓',
      icon_e_ugeek: '🤓',
      icon_cool: '😎',
      icon_lol: '😄',
      icon_mad: '😠',
      icon_razz: '😛',
      icon_redface: '😳',
      icon_cry: '😢',
      icon_evil: '👿',
      icon_twisted: '😈',
      icon_rolleyes: '🙄',
      icon_eek: '😳',
      icon_exclaim: '❗',
      icon_question: '❓',
      icon_idea: '💡',
      icon_arrow: '➡️',
      icon_neutral: '😐',
      // icon_mrgreen: as above.
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
      huh: '😕',
      rolleyes: '🙄',
      tongue: '😛',
      embarrassed: '😳',
      lipsrsealed: '🤐',
      undecided: '🫤',
      kiss: '😘',
      cry: '😢',
      evil: '😈',
      laugh: '😄',
      angel: '😇',
      // afro, azn, police: drawn characters with no Unicode counterpart.
    },
  },
  {
    name: 'MyBB',
    names: {
      smile: '🙂',
      wink: '😉',
      cool: '😎',
      biggrin: '😃',
      tongue: '😛',
      rolleyes: '🙄',
      shy: '🤭',
      sad: '🙁',
      angel: '😇',
      angry: '😠',
      blush: '🤭',
      confused: '😕',
      exclamation: '❗',
      heart: '❤️',
      huh: '😕',
      lightbulb: '💡',
      sleepy: '😴',
      undecided: '🫤',
      cry: '😢',
      sick: '🤢',
      arrow: '➡️',
      // at, my: MyBB-specific oddities with nothing to convert to.
      // dodgy: a shifty look, between 😏 and 😒 with no clear winner.
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
      hmm: '🤔',
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
      eek: '😳',
      sad: '🙁',
      smile: '🙂',
      smile2: '😃',
      doubt: '😕',
      doubt2: '😕',
      confused: '😕',
      biggrin: '😃',
      razz: '😛',
      surprised: '😮',
      silenced: '🤐',
      neutral: '😐',
      wink: '😉',
      facepalm: '🤦',
      fun: '😄',
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
      shy: '🤭',
      smile: '🙂',
      tongue: '😛',
      wink: '😉',
      // dead, dodge, gah, ill, mistrust, special: no unambiguous counterpart.
    },
  },
  {
    name: 'Serendipity',
    names: {
      normal: '😐', // Its config binds this to `:-|`
      unhappy: '🙁', // And this to `:(`
      haha: '😄',
      // anger, shame: each sits between two glyphs already used for near-synonyms.
      // grmpf, grrr, hero, ko, safe, still, whistle: no Unicode counterpart.
    },
  },
  {
    name: 'Khoros and Lithium',
    names: {
      '16x16_smiley-happy': '🙂',
      '16x16_smiley-wink': '😉',
      '16x16_smiley-very-happy': '😃',
      '16x16_smiley-tongue': '😛',
      '16x16_smiley-sad': '🙁',
      '16x16_smiley-surprised': '😲',
      '16x16_smiley-lol': '😆',
      '16x16_smiley-embarrassed': '😳',
      '16x16_smiley-indifferent': '😐',
      '16x16_heart': '❤️',
      '16x16_cat-happy': '😺',
      '16x16_cat-very-happy': '😸',
      '16x16_cat-lol': '😹',
      // 16x16_cat-wink, -tongue, -embarrassed: Unicode's cat faces stop at the three smiles above.
      // _woman-*, _man-*, _robot-*: no such faces at all.
    },
  },
  {
    name: 'CKEditor, FCKeditor and TinyMCE',
    names: {
      regular_smile: '🙂',
      teeth_smile: '😃',
      wink_smile: '😉',
      sad_smile: '🙁',
      cry_smile: '😭',
      angry_smile: '😠',
      confused_smile: '🫤',
      omg_smile: '😲',
      shades_smile: '😎',
      angel_smile: '😇',
      devil_smile: '😈',
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
    },
  },
  {
    name: 'Serendipity, Drupal and Kunena',
    names: {
      unsure: '😕', // Kunena's, seen at /media/kunena/emoticons/unsure.png
    },
  },
  {
    // Filenames observed in real feeds whose engine was never pinned down. Kept apart from the
    // lists above so those stay verifiable against a distribution, and this stays honest about
    // being unattributed.
    name: 'observed in feeds, engine not identified',
    names: {
      clap: '👏', // Boards add it to several engines' sets; 293 feeds, always applause
      laughing: '😄',
      ohmy: '😲',
      dizzy: '😵‍💫',
      thumbup: '👍',
      thumbdown: '👎',
      love: '😍',
      redface: '😳',
      innocent: '😇',
      devil: '😈',
      yell: '😡',
      // happy: means :BOL, ;D, XD, :) and ^_^ on different boards, so it cannot be resolved
      // from the filename alone.
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
  'SMILIES_PATH', // phpBB's template variable left unsubstituted, raw or percent-encoded
]
const directorySelector = directories.map((path) => `img[src*="${path}" i]`).join(', ')

// Forum smilie images and CSS-sprite emoji, which render oversized or as nothing without site CSS.
export const smiliesEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `${markerSelector}, ${directorySelector}, img[data-shortname]`,
  extract: (element) => {
    // XenForo paints its sprite sheet behind a 1x1 transparent GIF named by data-shortname.
    const src = element.getAttribute('src') ?? ''
    const isSprite = !!attr(element, 'data-shortname') && rendersNothing(src)
    const isStrong = isSprite || element.matches(markerSelector)

    if (!isStrong && !element.matches(directorySelector)) {
      return
    }

    return resolveEmojiImage(element, { isStrong, names: smiliesEmojiNames })
  },
}
