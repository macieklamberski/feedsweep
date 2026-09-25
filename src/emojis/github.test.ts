import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('githubImageEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('GitHub (gemoji README scrapings)', () => {
    it('should replace GitHub gemoji image when alt is the emoji glyph', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/unicode/1f680.png"
            alt="🚀"
          >
        </p>
      `
      const expected = '<p>🚀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode the filename when the alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/unicode/1f680.png"
            alt=":rocket:"
          >
        </p>
      `
      const expected = '<p>🚀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('gemoji names', () => {
    it('should replace an image whose file is named by a gemoji name', async () => {
      const value = html`
        <p>
          <img
            src="https://assets-cdn.github.com/images/icons/emoji/arrow_up.png"
            alt=":arrow_up:"
          >
        </p>
      `
      const expected = '<p>⬆️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hosts = [
      'githubassets.com/images/icons/emoji/',
      'assets.github.com/images/icons/emoji/',
      'assets-cdn.github.com/images/icons/emoji/',
    ]

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})

describeForEachParser('githubElementEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace the element with the glyph it holds', async () => {
    const value = html`
      <p>Works
        <g-emoji
          class="g-emoji"
          alias="+1"
          fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f44d.png"
        >👍</g-emoji>
      </p>
    `
    const expected = '<p>Works 👍</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode fallback-src when the glyph is garbled', async () => {
    const value = html`
      <p>
        <g-emoji
          class="g-emoji"
          alias="loud_sound"
          fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/1f50a.png"
        >读</g-emoji>
      </p>
    `
    const expected = '<p>🔊</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode fallback-src when the element is empty', async () => {
    const value = html`
      <p>
        <g-emoji
          class="g-emoji"
          alias="x"
          fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/274c.png"
        ></g-emoji>
      </p>
    `
    const expected = '<p>❌</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an empty element by its alias when the table carries it', async () => {
    const value = '<p><g-emoji class="g-emoji" alias="wink"></g-emoji></p>'
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an empty element by a gemoji alias the table misses', async () => {
    const value = '<p><g-emoji class="g-emoji" alias="tophat"></g-emoji></p>'
    const expected = '<p>🎩</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark the alias of an empty element as fallback text', async () => {
    const value = '<p><g-emoji class="g-emoji" alias="shipit"></g-emoji></p>'
    const expected = '<p><span data-emoji="">:shipit:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an element with neither text nor an alias untouched', async () => {
    const value = '<p>a <g-emoji class="g-emoji"></g-emoji> b</p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
