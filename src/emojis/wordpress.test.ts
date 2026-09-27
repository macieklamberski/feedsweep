import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('wordpressEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('WordPress (wp-smiley class + s.w.org host)', () => {
    it('should replace wp-smiley image with alt emoji', async () => {
      const value = html`
        <p>Hello
          <img
            src="https://s.w.org/images/core/emoji/17.0.2/72x72/1f609.png"
            alt="😉"
            class="wp-smiley"
          >
        </p>
      `
      const expected = '<p>Hello 😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace multiple wp-smiley images in the same paragraph', async () => {
      const value = html`
        <p>
          <img alt="😉" class="wp-smiley"> and <img alt="😊" class="wp-smiley">
        </p>
      `
      const expected = '<p>😉 and 😊</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should handle wp-smiley alongside additional classes', async () => {
      const value = '<p><img alt="😀" class="wp-smiley emoji extra"></p>'
      const expected = '<p>😀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace newer WP variant with class="emoji"', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            role="img"
            draggable="false"
            src="https://s.w.org/images/core/emoji/16.0.1/svg/1f914.svg"
            alt="🤔"
          >
        </p>
      `
      const expected = '<p>🤔</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The alt is a gemoji shortcode the table does not carry, but the filename names the
    // codepoint, so the picture states its own meaning. The mrgreen case below still covers an
    // untabled alt whose filename says nothing.
    it('should resolve a wp-smiley by its codepoint filename when the alt is untabled', async () => {
      const value = html`
        <p>
          <img
            src="https://s.w.org/images/core/emoji/12.0.0-1/72x72/1f40d.png"
            alt=":snake:"
            class="wp-smiley"
          >
        </p>
      `
      const expected = '<p>🐍</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace no-class WP variant matched by s.w.org URL', async () => {
      const value = html`
        <p>
          <img src="https://s.w.org/images/core/emoji/13.1.0/svg/1f680.svg" alt="🚀">
        </p>
      `
      const expected = '<p>🚀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a legacy wp-includes smilie whose alt is a shortcode', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/wp-includes/images/smilies/icon_smile.gif"
            alt=":)"
            class="wp-smiley"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the lossy mrgreen smilie with its working image', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/wp-includes/images/smilies/mrgreen.gif"
            alt=":mrgreen:"
            class="wp-smiley"
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should resolve a Tango icon-set filename once the face- prefix is dropped', async () => {
      const value = html`
        <p>
          <img
            class="wp-smiley"
            src="/wp-content/plugins/tango-smilies/tango/face-smile.png"
            alt=":)"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('WordPress core emoji (s.w.org host)', () => {
    // A "?" alt is WordPress failing to encode the emoji it meant. The filename still names the
    // codepoint.
    it('should decode the filename of an image with a "?" fallback alt', async () => {
      const value = html`
        <p>
          <img
            src="https://s.w.org/images/core/emoji/2.4/72x72/1f642.png"
            class="size_orig"
            alt="?"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('WordPress.com (wpcom-smileys Twemoji)', () => {
    it('should replace WordPress.com wpcom-smileys image', async () => {
      const value = html`
        <p>
          <img
            src="https://s0.wp.com/wp-content/mu-plugins/wpcom-smileys/twemoji/2/72x72/1f642.png"
            alt="🙂"
          >
        </p>
      `
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('non-emoji characters', () => {
    it('should replace a punctuation mark with its alt', async () => {
      const value = html`
        <p>It<img
            src="https://s.w.org/images/core/emoji/72x72/2019.png"
            alt="’"
            class="wp-smiley"
            style="height: 1em; max-height: 1em;"
          >s here</p>
      `
      const expected = '<p>It’s here</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a lone skin tone with its alt', async () => {
      const value = html`
        <p>
          <img
            src="https://s.w.org/images/core/emoji/2.2.1/72x72/1f3fb.png"
            alt="🏻"
            class="wp-smiley"
            style="height: 1em; max-height: 1em;"
          >
        </p>
      `
      const expected = '<p>🏻</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark an image whose alt differs from its filename', async () => {
      const value = html`
        <p>
          <img
            src="https://s.w.org/images/core/emoji/72x72/2019.png"
            alt="'"
            class="wp-smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://s.w.org/images/core/emoji/72x72/2019.png"
            alt="'"
            class="wp-smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('hosts', () => {
    const hostCases = [
      's.w.org/images/core/emoji/',
      's0.wp.com/wp-content/mu-plugins/wpcom-smileys/',
      's1.wp.com/wp-content/mu-plugins/wpcom-smileys/',
      's2.wp.com/wp-content/mu-plugins/wpcom-smileys/',
    ]

    it.each(hostCases)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave a photo that took the class from emoji markup in its alt untouched', async () => {
    const value =
      '<p><img src="https://example.com/wp-content/plugins/instagram-feed/img/placeholder.png" alt="<img src=&quot;https://s.w.org/images/core/emoji/15.0.3/72x72/1f5f3.png&quot; alt=&quot;🗳&quot;" class="wp-smiley"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
