import type { EmojiGlyph } from './emojis.js'

// The codes authors type, keyed in lower case. A code converts only when it has one meaning and one
// picture on every engine. The rest are false: engines draw their own faces for them, so only a
// filename can say which one an image shows.
export const emojiShortcodes: Record<string, EmojiGlyph> = {
  // One meaning and one picture on every engine.
  ':)': '🙂',
  ':-)': '🙂',
  '=)': '🙂',
  ':(': '🙁',
  ':-(': '🙁',
  ';)': '😉',
  ';-)': '😉',
  ':d': '😁',
  ':-d': '😁',
  ':p': '😛',
  ':-p': '😛',
  ':o': '😲',
  ':-o': '😲',
  ":'(": '😢',
  '<3': '❤️',
  ':smile:': '🙂',
  ':sad:': '🙁',
  ':wink:': '😉',
  ':cry:': '😢',
  ':cool:': '😎',
  ':lol:': '🤣',
  ':rofl:': '🤣',

  // One meaning, but engines disagree on the picture, or the word is one engine's own.
  xd: false,
  ':|': false,
  ':-|': false,
  ':*': false,
  ':-*': false,
  'o:)': false,
  'o:-)': false,
  '(y)': false,
  '(n)': false,
  ':roflmao:': false,
  ':razz:': false,
  ':neutral:': false,
  ':confused:': false,
  ':angry:': false,
  ':roll:': false,
  ':rolleyes:': false,
  ':sleep:': false,
  ':geek:': false,
  ':saint:': false,
  ':alien:': false,
  ':poop:': false,
  ':coffee:': false,
  ':clap:': false,
  ':thumbsup:': false,
  ':thumbup:': false,
  ':thumbsdown:': false,
  ':idea:': false,
  ':arrow:': false,
  ':!:': false,
  ':?:': false,

  // Drawn as a different face per engine.
  '8)': false, // Cool on phpBB, big eyes on NBBC
  '8-)': false,
  'b)': false,
  '8-o': false,
  ':?': false,
  ':-?': false,
  ':???:': false,
  '???': false,
  ':/': false,
  ':-\\': false,
  ':$': false,
  ':x': false, // Mad on phpBB and WordPress, love-struck on Yahoo
  ':-x': false, // Sealed lips on SMF
  ';d': false, // A grin on SMF, a big wink on NBBC
  ';-d': false,
  '>:(': false,
  '>:d': false,
  '>:-<': false,
  '>;)': false,
  ':))': false,
  '::)': false,
  ':-[': false,
  '-_-': false, // Sleep on IPB, squint on Facebook
  '^_^': false,
  '^^;': false,
  '>_>': false,
  '<g>': false,
  'o.o': false,
  o_o: false, // Dizzy on XenForo, skeptical on WP Monalisa
  ':evil:': false, // The angry devil on phpBB, the grinning one on WoltLab
  ':twisted:': false,
  ':devilish:': false,
  ':mad:': false,
  ':shock:': false,
  ':eek:': false,
  ':oops:': false,
  ':unsure:': false,
  ':huh:': false,
  ':love:': false,
  ':sick:': false,
  ':ugeek:': false,
  ':mrgreen:': false,
  ':wub:': false,
  ':blink:': false,
  ':wacko:': false,
  ':ph34r:': false,
  ':whistle:': false,
  ':mellow:': false,
  ':dry:': false,
  ':facepalm:': false,
  ':like:': false,
  ':cautious:': false, // XenForo 2
  ':censored:': false, // XenForo 2
  ':sneaky:': false, // XenForo 2
  ':giggle:': false, // XenForo 2
}
