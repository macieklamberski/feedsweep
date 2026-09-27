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
