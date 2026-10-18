import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

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

  it('should keep a smilie whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://i.li.ru//images/brandnewsmilies/angel.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://i.li.ru//images/brandnewsmilies/angel.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
