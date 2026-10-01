import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('tapatalkEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered emoji', async () => {
    const value = '<p><img src="https://emoji.tapatalk-cdn.com/emoji6.png"></p>'
    const expected = '<p><img data-emoji="" src="https://emoji.tapatalk-cdn.com/emoji6.png"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
