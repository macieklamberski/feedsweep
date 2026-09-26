import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('froalaImageEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should decode a codepoint filename', async () => {
    const value = html`
      <p>
        <img
          class="fr-fic fr-dii"
          src="https://example.com/froala/cke_smiley/1f60a.svg"
        >
      </p>
    `
    const expected = '<p>😊</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a CKEditor stock name', async () => {
    const value = html`
      <p>
        <img
          class="fr-fic fr-dii"
          src="https://example.com/froala/cke_smiley/wink_smile.gif"
        >
      </p>
    `
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram with no Unicode name', async () => {
    const value = html`
      <p>
        <img
          class="fr-fic fr-dii"
          src="https://example.com/froala/cke_smiley/item140.svg"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="fr-fic fr-dii"
          src="https://example.com/froala/cke_smiley/item140.svg"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})

describeForEachParser('froalaElementEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('codepoint backgrounds', () => {
    it('should replace a span painted with an EmojiOne file', async () => {
      const value = html`
        <p>Star
          <span
            class="fr-emoticon fr-deletable fr-emoticon-img"
            style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f4ab.svg);"
          >&nbsp;</span>
        </p>
      `
      const expected = '<p>Star 💫</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a span painted with a codepoint file off the builder', async () => {
      const value = html`
        <p>
          <span
            class="fr-emoticon fr-deletable fr-emoticon-img"
            style="background: url(&quot;https://example.com/froala/cke_smiley/2764.svg&quot;);"
          >&nbsp;</span>
        </p>
      `
      const expected = '<p>❤️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should replace a span painted with a CKEditor stock name', async () => {
    const value = html`
      <p>
        <span
          class="fr-emoticon fr-deletable fr-emoticon-img"
          style="background: url(https://example.com/froala/cke_smiley/cry_smile.gif);"
        >&nbsp;</span>
      </p>
    `
    const expected = '<p>😭</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should rebuild a span painted with a pictogram as a marked image', async () => {
    const value = html`
      <p>
        <span
          class="fr-emoticon fr-deletable fr-emoticon-img"
          style="background: url(&quot;https://example.com/froala/cke_smiley/item140.svg&quot;); width: 14px;"
        >&nbsp;</span>
      </p>
    `
    const expected = html`
      <p>
        <img
          src="https://example.com/froala/cke_smiley/item140.svg"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a span with no background image untouched', async () => {
    const value = html`
      <p>
        <span
          class="fr-emoticon fr-deletable fr-emoticon-img"
          style="background: rgb(255, 255, 255);"
        >&nbsp;</span>
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
