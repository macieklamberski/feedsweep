import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('vanillaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('engines with a single distinguishing case', () => {
    it('should replace a Vanilla smilie', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/smile.png"
            title=":smile:"
            alt=":smile:"
            height="20"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml('<p>😄</p>')
    })
  })

  describe('gemoji names', () => {
    const gemojiNameCases: Array<[string, string]> = [
      ['anguished', '😧'],
      ['confounded', '😖'],
      ['+1', '👍'],
      ['-1', '👎'],
      ['kiss', '💋'],
      ['sleepy', '😪'],
      ['smile', '😄'],
      ['smiley', '😃'],
      ['anger', '💢'],
    ]

    it.each(gemojiNameCases)('should replace %s by its gemoji name', async (name, glyph) => {
      const value = `<p><img class="emoji" src="https://example.com/resources/emoji/${name}.png" alt=":${name}:"></p>`
      const expected = `<p>${glyph}</p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a gemoji file by its name over the code in its alt', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/resources/emoji/frowning.png"
            title=":("
            alt=":("
          >
        </p>
      `
      const expected = '<p>😦</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a name gemoji does not know by the forum names', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/simple-smile.png"
            alt=":simple-smile:"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a gemoji file by its name when its alt is a false code', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/resources/emoji/sunglasses.png"
            title="B)"
            alt="B)"
          >
        </p>
      `
      const expected = '<p>😎</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace ok by its gemoji name, which a forum engine draws as its own face', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/ok.png"
            alt=":ok:"
          >
        </p>
      `
      const expected = '<p>🆗</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark trollface, which has no Unicode glyph', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/resources/emoji/trollface.png"
            alt=":trollface:"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoji"
            src="https://example.com/resources/emoji/trollface.png"
            alt=":trollface:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
