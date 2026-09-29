import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('artstationEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('ArtStation (/mailer/emoji/ path with a generic emoji class)', () => {
    // The path claims a stock name, which the stock set keeps as its picture.
    it('should mark a stock name from its path', async () => {
      const value = html`
        <p>
          <img class="emoji" alt="smiley" src="https://cdn.artstation.com/mailer/emoji/smiley.png">
        </p>
      `
      const expected = html`
        <p>
          <img
            class="emoji"
            alt="smiley"
            src="https://cdn.artstation.com/mailer/emoji/smiley.png"
            data-emoji=""
          >
        </p>
      `

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
