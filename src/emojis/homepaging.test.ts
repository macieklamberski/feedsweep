import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('homepagingEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const nameCases: Array<[string, string]> = [
    ['person/relaxed', '☺️'],
    ['nature/sparkles', '✨'],
  ]

  it.each(nameCases)('should replace %s by its gemoji name', async (name, glyph) => {
    const value = `<p><img class="emoji_image" src="https://example.com/homepaging/wp-content/common/emoji/${name}.png" alt="${name}.png"></p>`

    expect(await transform(value)).toEqualHtml(`<p>${glyph}</p>`)
  })

  it('should mark a file whose name gemoji does not know', async () => {
    const value =
      '<p><img src="https://example.com/homepaging/wp-content/common/emoji/other/logo.png" alt=""></p>'
    const expected =
      '<p><img src="https://example.com/homepaging/wp-content/common/emoji/other/logo.png" alt="" data-emoji=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
