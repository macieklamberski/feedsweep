import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  type EmojiNameTable,
  getFileStem,
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
      icon_razz: '😛',
      icon_cool: '😎',
      icon_lol: '🤣',
      icon_cry: '😢',
      icon_mad: '😠',
      icon_confused: '😕',
      icon_rolleyes: '🙄',
      icon_eek: '😲',
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
      icon_e_biggrin: '😁',
      icon_e_sad: '🙁',
      icon_e_tongue: '😛',
      icon_e_cool: '😎',
      icon_e_confused: '😕',
      icon_e_surprised: '😲',
      icon_e_geek: '🤓',
      icon_e_ugeek: '🤓',
      icon_cool: '😎',
      icon_lol: '🤣',
      icon_mad: '😠',
      icon_razz: '😛',
      icon_redface: '😳',
      icon_cry: '😢',
      icon_evil: '👿',
      icon_twisted: '😈',
      icon_rolleyes: '🙄',
      icon_eek: '😲',
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
      laugh: '🤣',
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
      biggrin: '😁',
      tongue: '😛',
      rolleyes: '🙄',
      shy: '🤭',
      sad: '🙁',
      angel: '😇',
      angry: '😠',
      blush: '😊',
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
      eek: '😲',
      sad: '🙁',
      smile: '🙂',
      smile2: '😁',
      doubt: '😕',
      doubt2: '😕',
      confused: '😕',
      biggrin: '😁',
      razz: '😛',
      surprised: '😲',
      silenced: '🤐',
      neutral: '😐',
      wink: '😉',
      facepalm: '🤦',
      fun: '🤣',
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
      haha: '🤣',
      // anger, shame: each sits between two glyphs already used for near-synonyms.
      // grmpf, grrr, hero, ko, safe, still, whistle: no Unicode counterpart.
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
      'smiley-frustrated': '😣',
      // cat-wink, -tongue, -embarrassed: Unicode's cat faces stop at the three smiles above.
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
      // TinyMCE 3's names, after its `smiley-` prefix. Vanilla ships the tongue and money faces.
      sealed: '🤐',
      embarassed: '😳', // Misspelled upstream
      'tongue-out': '😛',
      'money-mouth': '🤑',
      // foot-in-mouth: no Unicode counterpart.
    },
  },
  {
    name: 'Serendipity, Drupal and Kunena',
    names: {
      unsure: '😕', // Kunena's, seen at /media/kunena/emoticons/unsure.png
    },
  },
  {
    name: 'Invision Power Board and Kunena',
    names: {
      wub: '😍',
      blink: '😯',
      wacko: '🤪',
      ph34r: '🥷',
      w00t: '🤩',
      whistling: '😗',
      doh: '🤦',
      dry: '😒',
      mellow: '😑',
      sleep: '😴',
    },
  },
  {
    // Filenames observed in real feeds whose engine was never pinned down. Kept apart from the
    // lists above so those stay verifiable against a distribution, and this stays honest about
    // being unattributed.
    name: 'observed in feeds, engine not identified',
    names: {
      clap: '👏', // Boards add it to several engines' sets; 293 feeds, always applause
      laughing: '🤣',
      ohmy: '😲',
      dizzy: '😵‍💫',
      thumbup: '👍',
      thumbdown: '👎',
      love: '😍',
      redface: '😳',
      innocent: '😇',
      devil: '👿',
      yell: '😡',
      rofl: '🤣',
      rotfl: '🤣',
      yes: '🙂‍↕️',
      ok: '👍',
      good: '👍',
      hi: '👋',
      bye: '👋',
      crying: '😭',
      santa: '🎅',
      popcorn: '🍿',
      beer: '🍻',
      thumbsup: '👍',
      crazy: '🤪',
      cheers: '🥂',
      bravo: '👏',
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
const webWizEmojiNames = toMap({
  smiley1: '🙂',
  smiley2: '😉',
  smiley3: '😲',
  smiley4: '😁',
  smiley5: '😕',
  smiley6: '🙁',
  smiley7: '😡',
  smiley8: '🤡',
  smiley9: '😳',
  smiley10: '⭐',
  smiley11: '😵',
  smiley12: '😴',
  smiley13: '🤨',
  smiley14: '🙂‍↕️',
  smiley15: '😈',
  smiley16: '😎',
  smiley17: '😛',
  smiley18: '🤕',
  smiley19: '😢',
  smiley20: '👍',
  smiley21: '👎',
  smiley22: '😐',
  smiley23: '🤓',
  smiley24: '🫤',
  smiley25: '❓',
  smiley26: '😣',
  smiley27: '❤️',
  smiley28: '💔',
  smiley29: '🤪',
  smiley30: '🐷',
  smiley31: '🤗',
  smiley32: '👏',
  smiley33: '☯️',
  smiley34: '☢️',
  smiley35: '🤬',
  smiley36: '🤣',
  smiley37: '⚠️',
  smiley38: '💡',
  smiley39: '🤢',
  smiley40: '🥳',
  smiley41: '🍻',
  smiley42: '🤝',
})

// Discuz! X's names, some as generic as `time` and `call`, so read only from its own directory.
const discuzEmojiNames = toMap({
  huffy: '😡',
  titter: '🤭',
  sweat: '😓',
  loveliness: '🥰',
  funk: '😨',
  curse: '🤬',
  shutup: '🤐',
  hug: '🤗',
  victory: '✌️',
  time: '🕒',
  handshake: '🤝',
  call: '📞',
})

// NBBC's names for the codes the shared table draws as another face: `8)`, `;D`, `:s` and `<_<`.
// Read ahead of the alt, since NBBC writes the code there.
const nbbcEmojiNames = toMap({
  bigwink: '😜',
  bigeyes: '😳',
  worry: '😟',
  lookleft: '👀',
})

// XenForo 2's shortnames that other engines draw as another face: `o_O` is skeptical on WP
// Monalisa and a wow face on Menéame, and XenForo draws it dizzy.
const xenforoShortnames = toMap({
  o_o: '😵‍💫',
})

const glyphFromEngineName = (src: string): string | undefined => {
  // A XenForo sprite's base64 can contain `/`, leaving a stem that matches a name by accident.
  if (src.startsWith('data:')) {
    return
  }

  const path = src.toLowerCase()
  const stem = getFileStem(path)

  if (path.includes('/smileys/') && webWizEmojiNames.has(stem)) {
    return webWizEmojiNames.get(stem)
  }

  if (path.includes('static/image/smiley/') && discuzEmojiNames.has(stem)) {
    return discuzEmojiNames.get(stem)
  }

  return nbbcEmojiNames.get(stem)
}

// Samsung's Khoros set files each face as `<n>.<name>_<codepoints>`, as in `2.winking-face_1f609`,
// and a skin tone appends the modifier's name and codepoint after the full sequence.
const numberedNameRegex = /^[0-9]+\.([a-z-]+)_/

const glyphFromNumberedName = (src: string): string | undefined => {
  const stem = getFileStem(src).toLowerCase()
  const name = stem.match(numberedNameRegex)?.[1]

  if (!name) {
    return
  }

  // Samsung's own smiling face is filed under the codepoint of 🃏.
  if (name === 'samsung') {
    return '😀'
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

    const engineGlyph = glyphFromNumberedName(src) ?? glyphFromEngineName(src)

    return resolveEmojiImage(element, {
      isStrong,
      names: smiliesEmojiNames,
      glyph: engineGlyph ?? xenforoShortnames.get(shortname ?? ''),
    })
  },
}
