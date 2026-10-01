import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('liveinternetEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a blog smilie', async () => {
    const value = '<p><img src="https://i.li.ru//images/brandnewsmilies/angel.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://i.li.ru//images/brandnewsmilies/angel.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the same folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/images/brandnewsmilies/angel.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
