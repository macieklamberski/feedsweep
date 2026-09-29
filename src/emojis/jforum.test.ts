import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('jforumEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const hashCases: Array<string> = [
    '3b63d1616c5dfcf29f8a7a031aaa7cad', // :)
    '0320a00cb4bb5629ab9fc2bc1fcc4e9e', // :hunf:
    '1cfd6e2a9a2c0cf8e74b49b35e2e46c7', // :|
  ]

  it.each(hashCases)('should mark the stock smilie named %s', async (hash) => {
    const src = `https://example.com/jforum/images/smilies/${hash}.gif`
    const value = `<p><img src="${src}"></p>`
    const expected = `<p><img src="${src}" data-emoji=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })
})
