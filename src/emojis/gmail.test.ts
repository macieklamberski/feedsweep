import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('gmailEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji with an empty alt by its goomoji attribute', async () => {
    const value = html`
      <p>Cheers
        <img
          src="//ssl.gstatic.com/mail/emoji/v7/png48/emoji_u1f37a.png"
          alt=""
          goomoji="1f37a"
          data-goomoji="1f37a"
        >
      </p>
    `
    const expected = '<p>Cheers 🍺</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode the filename when the goomoji attribute is missing', async () => {
    const value = html`
      <p>
        <img src="//ssl.gstatic.com/mail/emoji/v7/png48/emoji_u1f601.png" alt="">
      </p>
    `
    const expected = '<p>😁</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an image off another host by its goomoji attribute', async () => {
    const value = '<p><img src="https://example.com/proxy/e.png" alt="" goomoji="1f44d"></p>'
    const expected = '<p>👍</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // The legacy code is Gmail's own numbering, not a codepoint, so the picture is all there is.
  it('should mark a legacy emoji named by its Gmail code', async () => {
    const value = html`
      <p>
        <img
          src="https://mail.google.com/mail/e/1B6"
          data-goomoji="1B6"
          goomoji="1B6"
          alt="[?]"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://mail.google.com/mail/e/1B6"
          data-goomoji="1B6"
          goomoji="1B6"
          alt="[?]"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an attachment image from the same host untouched', async () => {
    const value = html`
      <p>
        <img src="https://mail.google.com/mail/u/0/?ui=2&amp;attid=0.1&amp;disp=emb" alt="">
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
