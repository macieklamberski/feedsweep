import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('btblogEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram on a btblog blog', async () => {
    const value = '<p><img src="https://aiai05.btblog.jp/im/emoticon/hand2.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://aiai05.btblog.jp/im/emoticon/hand2.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram on a buttobi.net blog', async () => {
    const value = '<p><img src="https://nrt.buttobi.net/im/emoticon/ame.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://nrt.buttobi.net/im/emoticon/ame.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the same path on another host untouched', async () => {
    const value = '<p><img src="https://example.com/im/emoticon/hand2.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://aiai05.btblog.jp/im/emoticon/hand2.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://aiai05.btblog.jp/im/emoticon/hand2.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
