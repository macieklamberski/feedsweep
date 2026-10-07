import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('deviantartEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon with a deviantART code', async () => {
    const value = html`
      <p>
        <img
          src="https://e.deviantart.net/emoticons/h/happybounce.gif"
          alt=":happybounce:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://e.deviantart.net/emoticons/h/happybounce.gif"
          alt=":happybounce:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a universal code emoticon as a picture', async () => {
    const value = html`
      <p>
        <img
          src="https://e.deviantart.net/emoticons/s/smile.gif"
          alt=":)"
          title=":) (Smile)"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://e.deviantart.net/emoticons/s/smile.gif"
          alt=":)"
          title=":) (Smile)"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an emoticon with an emoji alt as a picture', async () => {
    const value = html`
      <p>
        <img
          src="https://e.deviantart.net/emoticons/b/biggrin.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://e.deviantart.net/emoticons/b/biggrin.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon from the older deviantart.com host', async () => {
    const value = html`<p><img src="https://e.deviantart.com/emoticons/g/glomp.gif"></p>`
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://e.deviantart.com/emoticons/g/glomp.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon with a protocol-relative url', async () => {
    const value = html`
      <p>
        <img
          src="//s.deviantart.net/emoticons/l/love2.gif"
          alt="Love"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="//s.deviantart.net/emoticons/l/love2.gif"
          alt="Love"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon from the st static host', async () => {
    const value = html`
      <p>
        <img
          src="https://st.deviantart.net/emoticons/h/happybounce.gif"
          alt=":happybounce:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://st.deviantart.net/emoticons/h/happybounce.gif"
          alt=":happybounce:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a deviantART emoticon path on another host untouched', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/e.deviantart.net/emoticons/h/happybounce.gif"
          alt=":happybounce:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
