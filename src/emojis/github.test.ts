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

    it('should replace a codepoint image with no alt by its glyph', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/unicode/1f914.png?v8"
            style="width: 20px;"
          >
        </p>
      `
      const expected = '<p>🤔</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('gemoji names', () => {
    it('should keep an image named by a gemoji name as a marked picture', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            title=":metal:"
            alt=":metal:"
            src="https://assets.github.com/images/icons/emoji/metal.png"
            height="20"
            width="20"
            align="absmiddle"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="emoji"
            title=":metal:"
            alt=":metal:"
            src="https://assets.github.com/images/icons/emoji/metal.png"
            height="20"
            width="20"
            align="absmiddle"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image named by a gemoji name with no alt as a marked picture', async () => {
      const value = html`
        <p>
          <img
            class="marked-emoji"
            src="https://github.githubassets.com/images/icons/emoji/warning.png"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="marked-emoji"
            src="https://github.githubassets.com/images/icons/emoji/warning.png"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image named by a GitHub drawing as a marked picture', async () => {
      const value = html`
        <p>
          <img src="https://github.githubassets.com/images/icons/emoji/bowtie.png" alt="bowtie">
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://github.githubassets.com/images/icons/emoji/bowtie.png"
            alt="bowtie"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep an image whose alt is a universal code as a marked picture', async () => {
      const value = html`
        <p>
          <img
            src="https://github.githubassets.com/images/icons/emoji/smile.png?v8"
            alt=":smile:"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://github.githubassets.com/images/icons/emoji/smile.png?v8"
            alt=":smile:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hostCases = [
      'githubassets.com/images/icons/emoji/',
      'assets.github.com/images/icons/emoji/',
      'assets-cdn.github.com/images/icons/emoji/',
    ]

    it.each(hostCases)('should replace an emoji image from %s', async (host) => {
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

  it('should replace an empty element by the gemoji glyph of an alias the shortcode table draws apart', async () => {
    const value = '<p><g-emoji class="g-emoji" alias="smile"></g-emoji></p>'
    const expected = '<p>😄</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark the alias of an empty element as fallback text', async () => {
    const value = '<p><g-emoji class="g-emoji" alias="shipit"></g-emoji></p>'
    const expected = '<p><span data-emoji="">:shipit:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  describe('tone', () => {
    it('should apply the skin tone to the glyph', async () => {
      const value = '<p><g-emoji class="g-emoji" alias="+1" tone="3">👍</g-emoji></p>'
      const expected = '<p>👍🏽</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should put the skin tone in place of the variation selector', async () => {
      const value = '<p><g-emoji class="g-emoji" alias="point_up" tone="1">☝️</g-emoji></p>'
      const expected = '<p>☝🏻</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should apply several tones to the people of a sequence in turn', async () => {
      const value = html`
        <p>
          <g-emoji class="g-emoji" alias="couple_with_heart_woman_man" tone="1 5">👩‍❤️‍👨</g-emoji>
        </p>
      `
      const expected = '<p>👩🏻‍❤️‍👨🏿</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should skip the handshake between two people when applying tones in turn', async () => {
      const value = html`
        <p>
          <g-emoji class="g-emoji" alias="people_holding_hands" tone="1 5">🧑‍🤝‍🧑</g-emoji>
        </p>
      `
      const expected = '<p>🧑🏻‍🤝‍🧑🏿</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should clear the skin tone when the tone is 0', async () => {
      const value = '<p><g-emoji class="g-emoji" alias="+1" tone="0">👍🏽</g-emoji></p>'
      const expected = '<p>👍</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave an element with neither text nor an alias untouched', async () => {
    const value = '<p>a <g-emoji class="g-emoji"></g-emoji> b</p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
