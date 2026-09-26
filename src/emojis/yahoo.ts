import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { getFileStem, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Yahoo Messenger's emoticons by file number, with the code and the name Yahoo gave each. The
// codes are not read: `:x`, `:-?`, `:-$` and `:-@` mean other things on other engines.
const yahooEmoticons = toMap({
  1: '🙂', // :) happy
  2: '🙁', // :( sad
  3: '😉', // ;) winking
  4: '😁', // :D big grin
  5: '😉', // ;;) batting eyelashes
  6: '🤗', // >:D< big hug
  7: '😕', // :-/ confused
  8: '🥰', // :x love struck
  9: '😳', // :"> blushing
  10: '😛', // :P tongue
  11: '😘', // :-* kiss
  12: '💔', // =(( broken heart
  13: '😲', // :-O surprise
  14: '😡', // X( angry
  15: '😏', // :> smug
  16: '😎', // B-) cool
  17: '😟', // :-S worried
  18: '😅', // #:-S whew!
  19: '😈', // >:) devil
  20: '😭', // :(( crying
  21: '🤣', // :)) laughing
  22: '😐', // :| straight face
  23: '🤨', // /:) raised eyebrows
  24: '🤣', // =)) rolling on the floor
  25: '😇', // O:-) angel
  26: '🤓', // :-B nerd
  27: '✋', // =; talk to the hand
  28: '😴', // I-) sleepy
  29: '🙄', // 8-| rolling eyes
  30: '👎', // L-) loser
  31: '🤢', // :-& sick
  32: '🤫', // :-$ don't tell anyone
  33: '😤', // [-( no talking
  34: '🤡', // :O) clown
  35: '🤪', // 8-} silly
  36: '🥳', // <:-P party
  37: '🥱', // (:| yawn
  38: '🤤', // =P~ drooling
  39: '🤔', // :-? thinking
  40: '🤦', // #-o d'oh
  41: '👏', // =D> applause
  42: '😬', // :-SS nail biting
  43: '😵‍💫', // @-) hypnotized
  44: '🤥', // :^o liar
  45: '⏳', // :-w waiting
  46: '😮‍💨', // :-< sigh
  47: '😝', // >:P phbbbbt
  48: '🤠', // <):) cowboy
  49: '🐷', // :@) pig
  50: '🐮', // 3:-O cow
  51: '🐵', // :(|) monkey
  52: '🐔', // ~:> chicken
  53: '🌹', // @};- rose
  54: '🍀', // %%- good luck
  55: '🇺🇸', // **== flag
  56: '🎃', // (~~) pumpkin
  57: '☕', // ~O) coffee
  58: '💡', // *-:) idea
  59: '💀', // 8-X skull
  60: '🐛', // =:) bug
  61: '👽', // >-) alien
  62: '😣', // :-L frustrated
  63: '🙏', // [-O< praying
  64: '🤑', // $-) money eyes
  65: '😗', // :-" whistling
  66: '🤕', // b-( feeling beat up
  67: '✌️', // :)>- peace sign
  68: '☝️', // [-X shame on you
  69: '💃', // \:D/ dancing
  70: '👊', // >:/ bring it on
  71: '🤭', // ;)) hee hee
  // 72 o-> hiro, 73 o=> billy and 74 o-+ april are drawn characters with no emoji.
  75: '☯️', // (%) yin yang
  // 76 :-@ chatterbox keeps its picture.
  77: '🙇', // ^:)^ not worthy
  78: '😆', // :-j oh go on
  79: '⭐', // (*) star
  100: '📞', // :)] on the phone
  101: '🤙', // :-c call me
  102: '😫', // ~X( at wits' end
  103: '👋', // :-h wave
  104: '⏸️', // :-t time out
  105: '😌', // 8-> day dreaming
  106: '🤷', // :-?? I don't know
  107: '🙉', // %-( not listening
  108: '🥺', // :o3 puppy dog eyes
  109: '🫣', // X_X I don't want to see
  110: '⏰', // :!! hurry up!
  111: '🤘', // \m/ rock on!
  112: '👎', // :-q thumbs down
  113: '👍', // :-bd thumbs up
  114: '🙅', // ^#(^ it wasn't me
})

const selectors = [
  'img[src*="yimg.com/" i][src*="/i/mesg/emoticons" i]', // Messenger's emoticons, on every host
  'img[src*="yimg.com/nq/yemoji_assets/" i]', // Yahoo's own emoji, named by codepoint
]

// Yahoo Messenger's emoticons, as blogs pasted them straight from its image hosts. The directory
// is Yahoo's own, so a number with no emoji keeps its picture.
export const yahooEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    const glyph = yahooEmoticons.get(getFileStem(element.getAttribute('src') ?? ''))

    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames, glyph })
  },
}
