import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, getFileStem, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// Yahoo Messenger's emoticons by file number, with the code and the name Yahoo gave each. Each is
// Yahoo's own drawing, and codes like `:x`, `:-?`, `:-$` and `:-@` mean other faces elsewhere.
const yahooEmoticons = toMap<EmojiGlyph>({
  1: false, // :) happy
  2: false, // :( sad
  3: false, // ;) winking
  4: false, // :D big grin
  5: false, // ;;) batting eyelashes
  6: false, // >:D< big hug
  7: false, // :-/ confused
  8: false, // :x love struck
  9: false, // :"> blushing
  10: false, // :P tongue
  11: false, // :-* kiss
  12: false, // =(( broken heart
  13: false, // :-O surprise
  14: false, // X( angry
  15: false, // :> smug
  16: false, // B-) cool
  17: false, // :-S worried
  18: false, // #:-S whew!
  19: false, // >:) devil
  20: false, // :(( crying
  21: false, // :)) laughing
  22: false, // :| straight face
  23: false, // /:) raised eyebrows
  24: false, // =)) rolling on the floor
  25: false, // O:-) angel
  26: false, // :-B nerd
  27: false, // =; talk to the hand
  28: false, // I-) sleepy
  29: false, // 8-| rolling eyes
  30: false, // L-) loser
  31: false, // :-& sick
  32: false, // :-$ don't tell anyone
  33: false, // [-( no talking
  34: false, // :O) clown
  35: false, // 8-} silly
  36: false, // <:-P party
  37: false, // (:| yawn
  38: false, // =P~ drooling
  39: false, // :-? thinking
  40: false, // #-o d'oh
  41: false, // =D> applause
  42: false, // :-SS nail biting
  43: false, // @-) hypnotized
  44: false, // :^o liar
  45: false, // :-w waiting
  46: false, // :-< sigh
  47: false, // >:P phbbbbt
  48: false, // <):) cowboy
  49: false, // :@) pig
  50: false, // 3:-O cow
  51: false, // :(|) monkey
  52: false, // ~:> chicken
  53: false, // @};- rose
  54: false, // %%- good luck
  55: false, // **== flag
  56: false, // (~~) pumpkin
  57: false, // ~O) coffee
  58: false, // *-:) idea
  59: false, // 8-X skull
  60: false, // =:) bug
  61: false, // >-) alien
  62: false, // :-L frustrated
  63: false, // [-O< praying
  64: false, // $-) money eyes
  65: false, // :-" whistling
  66: false, // b-( feeling beat up
  67: false, // :)>- peace sign
  68: false, // [-X shame on you
  69: false, // \:D/ dancing
  70: false, // >:/ bring it on
  71: false, // ;)) hee hee
  72: false, // o-> hiro
  73: false, // o=> billy
  74: false, // o-+ april
  75: false, // (%) yin yang
  76: false, // :-@ chatterbox
  77: false, // ^:)^ not worthy
  78: false, // :-j oh go on
  79: false, // (*) star
  100: false, // :)] on the phone
  101: false, // :-c call me
  102: false, // ~X( at wits' end
  103: false, // :-h wave
  104: false, // :-t time out
  105: false, // 8-> day dreaming
  106: false, // :-?? I don't know
  107: false, // %-( not listening
  108: false, // :o3 puppy dog eyes
  109: false, // X_X I don't want to see
  110: false, // :!! hurry up!
  111: false, // \m/ rock on!
  112: false, // :-q thumbs down
  113: false, // :-bd thumbs up
  114: false, // ^#(^ it wasn't me
})

const selectors = [
  'img[src*="yimg.com/" i][src*="/i/mesg/emoticons" i]', // Messenger's emoticons, on every host
  'img[src*="yimg.com/nq/yemoji_assets/" i]', // Yahoo's own emoji, named by codepoint
]

// Yahoo Messenger's emoticons, as blogs pasted them straight from its image hosts. The directory
// is Yahoo's own, so every number keeps its picture.
export const yahooEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: selectors.join(', '),
  extract: (element) => {
    const glyph = yahooEmoticons.get(getFileStem(element.getAttribute('src') ?? ''))

    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames, glyph })
  },
}
