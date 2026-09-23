import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('seesaaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram from the images_g set', async () => {
    const value = '<p><img src="https://blog.seesaa.jp/images_g/1/37.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://blog.seesaa.jp/images_g/1/37.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the images_e set', async () => {
    const value = '<p><img src="https://blog.seesaa.jp/images_e/86.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://blog.seesaa.jp/images_e/86.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
