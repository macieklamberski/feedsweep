import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('genericEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('shortcode alts', () => {
    it('should leave a Discourse shortcode-alt with class="emoji" untouched', async () => {
      const value = '<p><img class="emoji" alt=":slight_smile:"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave a gemoji shortcode-alt with class="emoji" untouched', async () => {
      const value = '<p><img class="emoji" alt=":tophat:"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })

  describe('codepoint filenames', () => {
    it('should decode a codepoint filename with a variation selector', async () => {
      const value = html`
        <p>Flying
          <img
            class="emoji"
            src="https://example.com/emojis/2708-fe0f.png"
            alt="airplane"
          >
        </p>
      `
      const expected = '<p>Flying ✈️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode a NodeBB Emoji One filename', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/plugins/nodebb-plugin-emoji-one/static/images/1f600.png"
            alt=":grinning:"
          >
        </p>
      `
      const expected = '<p>😀</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should decode an Atlassian emoji service filename', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://pf-emoji-service--cdn.us-east-1.prod.public.atl-paas.net/standard/ef8b0642-7523-4e13-9fd3-01b65648acf6/32x32/1f947.png"
            alt=":first_place:"
          >
        </p>
      `
      const expected = '<p>🥇</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a named file with a shortcode alt untouched', async () => {
      const value = html`
        <p>
          <img
            class="emoji"
            src="https://example.com/assets/emoji/party_parrot.gif"
            alt=":party_parrot:"
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
