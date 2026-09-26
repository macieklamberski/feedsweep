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

  describe('hosts', () => {
    const hosts = ['s.w.org/images/core/emoji/', 's0.wp.com/wp-content/mu-plugins/wpcom-smileys/']

    it.each(hosts)('should replace an emoji image from %s', async (host) => {
      const value = `<p>Hi <img src="https://${host}1f642.png" alt="🙂"></p>`
      const expected = '<p>Hi 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
