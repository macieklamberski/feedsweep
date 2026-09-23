import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('mastodonEmojiResolver', (parseHtml) => {
  const { transformKeeping } = emojiConverters(parseHtml)

  describe('Mastodon (custom_emojis path with an emojione class)', () => {
    // Custom emoji have no Unicode counterpart at all, so there is nothing to convert them to.
    it('should leave a custom emoji with its picture', async () => {
      const value = html`
        <p>
          <img
            rel="emoji"
            class="emojione"
            alt=":catjam:"
            src="https://files.mastodon.social/custom_emojis/images/000/224/097/original/d9c.gif"
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
