import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('liveWriterEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon by its class', async () => {
    const value = html`
      <p>
        <img
          class="wlEmoticon wlEmoticon-smile"
          alt="Smile"
          src="https://example.com/wp-content/uploads/2020/08/wlEmoticon-smile.png"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="wlEmoticon wlEmoticon-smile"
          alt="Smile"
          src="https://example.com/wp-content/uploads/2020/08/wlEmoticon-smile.png"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon whose url has no filename', async () => {
    const value = html`
      <p>
        <img
          class="wlEmoticon wlEmoticon-winkingsmile"
          alt="Smilefjes som blunker"
          src="https://example.com/img/b/R29vZ2xl/AVvXsEgfS9XPlaCbW0X67Lm6X/?imgmax=800"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="wlEmoticon wlEmoticon-winkingsmile"
          alt="Smilefjes som blunker"
          src="https://example.com/img/b/R29vZ2xl/AVvXsEgfS9XPlaCbW0X67Lm6X/?imgmax=800"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a re-uploaded emoticon by its filename', async () => {
    const value = html`
      <p>
        <img
          alt="Winking smile"
          src="https://example.com/wp-content/uploads/2019/03/1212.wlEmoticon-winkingsmile_63772F9B.png"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="Winking smile"
          src="https://example.com/wp-content/uploads/2019/03/1212.wlEmoticon-winkingsmile_63772F9B.png"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the picture when the alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          class="wlEmoticon wlEmoticon-smile"
          alt="🙂"
          src="https://example.com/wp-content/uploads/wlEmoticon-smile.png"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="wlEmoticon wlEmoticon-smile"
          alt="🙂"
          src="https://example.com/wp-content/uploads/wlEmoticon-smile.png"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image without the Live Writer class or filename untouched', async () => {
    const value = html`
      <p>
        <img
          class="emoticon-smile"
          alt="Smile"
          src="https://example.com/wp-content/uploads/emoticon-smile.png"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
