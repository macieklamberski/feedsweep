import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('e107EmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  // From e107's own default set. The last two are misspelled in the distribution.
  const nameCases: Array<[string, string, string]> = [
    [
      'smile',
      '<img class="e-emoticon" src="/e107_images/emotes/default/smile.png" alt="smile">',
      '🙂',
    ],
    [
      'suprised',
      '<img class="e-emoticon" src="/e107_images/emotes/default/suprised.png" alt="">',
      '😲',
    ],
    [
      'cheesey',
      '<img class="e-emoticon" src="/e107_images/emotes/default/cheesey.png" alt="">',
      '😁',
    ],
  ]

  it.each(nameCases)('should replace the %s emoticon', async (_name, tag, expected) => {
    expect(await transform(`<p>${tag}</p>`)).toEqualHtml(`<p>${expected}</p>`)
  })
})
