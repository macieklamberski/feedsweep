import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('forumotionEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should leave a Forumotion name outside its host untouched', async () => {
    const value = '<p><img src="https://example.com/images/smiles/herz.png" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
