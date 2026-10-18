import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('jeuxvideoEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered smiley', async () => {
    const value = '<p><img src="http://image.jeuxvideo.com/smileys_img/18.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="http://image.jeuxvideo.com/smileys_img/18.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a smileys folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/smileys_img/18.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a smiley whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="http://image.jeuxvideo.com/smileys_img/18.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="http://image.jeuxvideo.com/smileys_img/18.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
