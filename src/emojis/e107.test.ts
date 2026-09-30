import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('e107EmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon by its e-emoticon class', async () => {
    const value =
      '<p><img class="e-emoticon" src="/e107_images/emotes/default/smile.png" alt="smile"></p>'
    const expected =
      '<p><img class="e-emoticon" src="/e107_images/emotes/default/smile.png" alt="smile" data-emoji=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // From e107's own default set, both misspelled in the distribution. Without the class, only a
  // known name is marked.
  const nameCases: Array<string> = ['suprised', 'cheesey']

  it.each(nameCases)('should mark the %s emoticon from its directory', async (name) => {
    const value = `<p><img src="/e107_images/emotes/default/${name}.png" alt=""></p>`
    const expected = `<p><img src="/e107_images/emotes/default/${name}.png" alt="" data-emoji=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an unknown image in the emotes directory untouched', async () => {
    const value = '<p><img src="/e107_images/emotes/default/banner.png" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
