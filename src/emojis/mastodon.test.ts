import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('mastodonEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

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

  it('should replace an emojione image named by codepoint', async () => {
    const value =
      '<p><img class="emojione" alt="blush" src="https://example.com/plugins/emoji/images/1F60A.png"></p>'

    expect(await transform(value)).toEqualHtml('<p>😊</p>')
  })

  it('should replace a stock SVG copied without the class', async () => {
    const value =
      '<p><img draggable="false" src="https://example.social/emoji/1f1ee-1f1f9.svg"></p>'

    expect(await transform(value)).toEqualHtml('<p>🇮🇹</p>')
  })

  it('should leave an SVG in an emoji folder that names no codepoint untouched', async () => {
    const value = '<p><img draggable="false" src="https://example.com/emoji/logo.svg"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
