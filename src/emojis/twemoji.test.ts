import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('twemojiEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('Twemoji', () => {
    it('should replace a Ruby China emoji served from its own mirror', async () => {
      const value = html`
        <p>
          <img
            title=":joy:"
            alt="😂"
            src="https://twemoji.ruby-china.com/2/svg/1f602.svg"
            class="twemoji"
          >
        </p>
      `
      const expected = '<p>😂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a self-hosted emoji by its class alone', async () => {
      const value = '<p><img alt="" src="https://example.com/assets/1f602.svg" class="twemoji"></p>'
      const expected = '<p>😂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    const pathCases: Array<[string, string]> = [
      [
        'jsDelivr fork',
        'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/1f602.png',
      ],
      ['cdnjs', 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f602.png'],
      ['Forumotion', 'https://illiweb.com/fa/twemoji/16x16/1f602.png'],
      ['Twitter', 'https://abs-0.twimg.com/emoji/v2/72x72/1f602.png'],
    ]

    it.each(pathCases)('should replace a %s emoji from its filename', async (_host, source) => {
      const value = `<p><img src="${source}" alt=""></p>`

      expect(await transform(value)).toEqualHtml('<p>😂</p>')
    })

    it('should replace a multi-codepoint emoji from its filename', async () => {
      const value = html`
        <p>
          <img src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f468-200d-1f4bb.png" alt="">
        </p>
      `
      const expected = '<p>👨‍💻</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Twemoji drops the leading zeros from the codepoints below 0x100.
    const shortNameCases: Array<[string, string]> = [
      ['a9', '©️'],
      ['ae', '®️'],
      ['23-20e3', '#⃣'],
      ['2a-fe0f-20e3', '*️⃣'],
      ['31_20e3', '1⃣'],
    ]

    it.each(shortNameCases)('should decode the two-digit filename %s', async (stem, glyph) => {
      const value = `<p><img src="https://example.com/twemoji/72x72/${stem}.png" alt=""></p>`

      expect(await transform(value)).toEqualHtml(`<p>${glyph}</p>`)
    })

    it('should leave a two-digit filename that is no emoji untouched', async () => {
      const value = '<p><img src="https://example.com/twemoji/72x72/12.png" alt=""></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should replace an emoji whose alt was translated', async () => {
      const value = html`
        <p>
          <img src="https://abs-0.twimg.com/emoji/v2/72x72/1f49a.png" alt="Corazón verde">
        </p>
      `
      const expected = '<p>💚</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an image named after the set but not a codepoint untouched', async () => {
      const value =
        '<p><img src="https://example.com/uploads/twemoji-preview.png" alt="Preview"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('non-emoji characters', () => {
    it('should replace the question mark a broken encoding left with its alt', async () => {
      const value = html`
        <p>Really
          <img
            src="https://twemoji.maxcdn.com/2/72x72/3f.png"
            class="ipsEmoji"
            alt="?"
          >
        </p>
      `
      const expected = '<p>Really ?</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should drop the variation selector from the alt', async () => {
      const value = html`
        <p>Really
          <img
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/3f.png"
            class="ipsEmoji"
            alt="?️"
          >
        </p>
      `
      const expected = '<p>Really ?</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('Twitter / X (embedded tweets)', () => {
    it('should replace Twitter/X emoji image', async () => {
      const value = '<p><img src="https://abs.twimg.com/emoji/v2/72x72/1f600.png" alt="😀"></p>'
      const expected = '<p>😀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hostCases = [
      'cdn.jsdelivr.net/gh/twitter/twemoji',
      'twemoji.maxcdn.com/',
      'twimg.com/emoji/',
    ]

    it.each(hostCases)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an emoji from the sopili mirror by its codepoint filename', async () => {
      const value =
        '<p><img src="https://pic.sopili.net/pub/emoji/twitter/2/72x72/1f914.png" width="20" height="20"></p>'

      expect(await transform(value)).toEqualHtml('<p>🤔</p>')
    })
  })
})

describeForEachParser('twemojiElementEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an empty span painted with a Twemoji file by its codepoint', async () => {
    const value =
      '<p>Hi <span style="-webkit-text-fill-color: transparent; background-image: url(&quot;https://abs-0.twimg.com/emoji/v2/svg/1f9d0.svg&quot;);"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi 🧐</p>')
  })

  it('should keep the glyph a painted span already holds', async () => {
    const value =
      '<p><span style="background-image: url(https://abs.twimg.com/emoji/v2/72x72/1f600.png)">😀</span></p>'

    expect(await transform(value)).toEqualHtml('<p>😀</p>')
  })

  it('should leave a painted span holding prose untouched', async () => {
    const value =
      '<p><span style="background-image: url(https://abs.twimg.com/emoji/v2/72x72/1f600.png)">Hello</span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
