import { toMap } from 'trousse'
import type { EmojiResolver } from '../types.js'
import { type EmojiGlyph, resolveEmojiImage } from '../utils/emojis.js'
import { getDirectoryGlyph, smiliesEmojiNames } from './smilies.js'

const directory = '/images/smilies/'

// JForum's stock smilies, each named by a hash, with the codes its install data binds to them.
const jforumEmojiNames = toMap<EmojiGlyph>({
  '3b63d1616c5dfcf29f8a7a031aaa7cad': false, // :) :-)
  '283a16da79f3aa23fe1025c96295f04f': false, // :D :-D
  '9d71f0541cff0a302a0309c5079e8dee': false, // :( :-(
  ed515dbff23a0ee3241dcc0a601c9ed6: false, // :mrgreen:
  '47941865eb7bbc2a777305b46cc059a2': false, // :-o
  '385970365b8ed7503b4294502a458efa': false, // :shock:
  '0a4d7238daa496a758252d0a2b1a1384': false, // :?:
  b2eb59423fbf5fa39342041237025880: false, // 8)
  '97ada74b88049a6d50a6ed40898a03d7': false, // :lol:
  '1069449046bcd664c21db15b1dfedaee': false, // :x
  '69934afc394145350659cd7add244ca9': false, // :P :-P
  '499fd50bc713bfcdf2ab5a23c00c2d62': false, // :oops:
  c30b4198e0907b23b8246bdd52aa1c3c: false, // :cry:
  '2e207fad049d4d292f60607f80f05768': false, // :evil:
  '908627bbe5e9f6a080977db8c365caff': false, // :twisted:
  '2786c5c8e1a8be796fb2f726cca5a0fe': false, // :roll:
  '8a80c6485cd926be453217d59a84a888': false, // :wink: ;) ;-)
  '9293feeb0183c67ea1ea8c52f0dbaf8c': false, // :!:
  '136dd33cba83140c7ce38db096d05aed': false, // :?
  '8f7fb9dd46fb8ef86f81154a4feaada9': false, // :idea:
  d6741711aa045b812616853b5507fd2a: false, // :arrow:
  '0320a00cb4bb5629ab9fc2bc1fcc4e9e': false, // :hunf:
  '49869fe8223507d7223db3451e5321aa': false, // :XD:
  e8a506dc4ad763aca51bec4ca7dc8560: false, // :thumbup:
  e78feac27fa924c4d0ad6cf5819f3554: false, // :thumbdown:
  '1cfd6e2a9a2c0cf8e74b49b35e2e46c7': false, // :|
})

// JForum's smilies, found under its smilie directory by the hash it names each file with.
export const jforumEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `img[src*="${directory}" i]`,
  extract: (element) => {
    const glyph = getDirectoryGlyph(element.getAttribute('src') ?? '', directory, jforumEmojiNames)

    if (glyph === undefined) {
      return
    }

    return resolveEmojiImage(element, { isStrong: false, names: smiliesEmojiNames, glyph })
  },
}
