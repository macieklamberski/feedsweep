import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('artstationEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('ArtStation (/mailer/emoji/ path with a generic emoji class)', () => {
    // The generic class is read for a glyph alt and never for a shortcode, so the path is what
    // lets the filename be looked up.
    it('should replace an emoji named only by its path', async () => {
      const value = html`
        <p>
          <img class="emoji" alt="smiley" src="https://cdn.artstation.com/mailer/emoji/smiley.png">
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an emoji whose name is not in the table alone', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            alt="partying"
            src="https://cdn.artstation.com/mailer/emoji/partying.png"
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
