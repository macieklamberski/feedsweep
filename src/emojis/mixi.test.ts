import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('mixiEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoji from mixi', async () => {
    const value = '<p><img src="http://img.mixi.jp/img/emoji/50.gif" alt=""></p>'
    const expected = '<p><img data-emoji="" src="http://img.mixi.jp/img/emoji/50.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoji from the second mixi host', async () => {
    const value = '<p><img src="https://img.mixi.net/img/emoji/50.gif" alt=""></p>'
    const expected = '<p><img data-emoji="" src="https://img.mixi.net/img/emoji/50.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoji folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/img/emoji/50.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep an emoji whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="http://img.mixi.jp/img/emoji/50.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="http://img.mixi.jp/img/emoji/50.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
