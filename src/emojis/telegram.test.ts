import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('telegramEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('Telegram (tg-emoji element)', () => {
    it('should replace the element with the glyph it wraps', async () => {
      const value = '<p>Nice work <tg-emoji emoji-id="5368324170671202286">👍</tg-emoji> today</p>'
      const expected = '<p>Nice work 👍 today</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace several elements in one paragraph', async () => {
      const value = html`
        <p>
          <tg-emoji emoji-id="1">🔥</tg-emoji>
          <tg-emoji emoji-id="2">🎉</tg-emoji>
        </p>
      `
      const expected = '<p>🔥🎉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve position inside a link', async () => {
      const value = '<p><a href="/x">go <tg-emoji emoji-id="1">👍</tg-emoji></a></p>'
      const expected = '<p><a href="/x">go 👍</a></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a multi-codepoint fallback intact', async () => {
      const value = '<p><tg-emoji emoji-id="1">👨‍👩‍👧</tg-emoji></p>'
      const expected = '<p>👨‍👩‍👧</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark the text of a fallback that is not an emoji', async () => {
      const value = '<p><tg-emoji emoji-id="1">[cat]</tg-emoji></p>'
      const expected = '<p><span data-emoji="">[cat]</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should flatten a fallback wrapped in another element', async () => {
      const value = '<p><tg-emoji emoji-id="1"><span>👍</span></tg-emoji></p>'
      const expected = '<p>👍</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an empty element untouched', async () => {
      const value = '<p>a <tg-emoji emoji-id="1"></tg-emoji> b</p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // The facades this package rebuilds into real iframes are custom elements too, so the tag
    // list stays explicit and anything else hyphenated that wraps text is left alone.
    it('should leave other custom elements untouched', async () => {
      const value = html`
        <p>
          <lite-youtube videoid="dQw4w9WgXcQ"></lite-youtube>
          <my-widget>text</my-widget>
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should be idempotent', async () => {
      const value = '<p>Hi <tg-emoji emoji-id="1">👍</tg-emoji></p>'
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
