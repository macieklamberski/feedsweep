import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'
import { vanillaEmojiNameTable } from './vanilla.js'

const asciiLetterRegex = /[a-zA-Z]/

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

      expect(await transform(value)).toEqualHtml('<p>🙂</p>')
    })
  })

  describe('gemoji names', () => {
    const gemojiNames: Array<[string, string]> = [
      ['anguished', '😧'],
      ['confounded', '😖'],
      ['+1', '👍'],
      ['-1', '👎'],
    ]

    it.each(gemojiNames)('should replace %s, which the forum names miss', async (name, glyph) => {
      const value = `<p><img class="emoji" src="https://example.com/resources/emoji/${name}.png" alt=":${name}:"></p>`
      const expected = `<p>${glyph}</p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The forum names draw these differently from gemoji, and win until an image review.
    const forumNames: Array<[string, string]> = [
      ['kiss', '😘'],
      ['sleepy', '😴'],
      ['smile', '🙂'],
      ['smiley', '🙂'],
    ]

    it.each(forumNames)('should keep the forum glyph for %s', async (name, glyph) => {
      const value = `<p><img class="emoji" src="https://example.com/resources/emoji/${name}.png" alt=":${name}:"></p>`
      const expected = `<p>${glyph}</p>`

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

  describe('platform filename table', () => {
    const nameEntries = [vanillaEmojiNameTable].flatMap((platform) =>
      Object.entries(platform.names).map(([name, glyph]) => [platform.name, name, glyph] as const),
    )

    it.each(nameEntries)('should map the %s name %s to a bare glyph', (_platform, _name, glyph) => {
      expect(glyph).not.toBe('')
      expect(glyph).not.toMatch(asciiLetterRegex)
    })

    it.each(nameEntries)(
      'should key the %s name %s in lower case, as getFileStem normalizes',
      (_platform, name) => {
        expect(name).toBe(name.toLowerCase())
      },
    )
  })
})
