import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('outlookEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('happy paths', () => {
    it('should replace an Outlook.com emoji by its codepoint filename', async () => {
      const value = html`
        <p>
          <img
            alt="Grønt hjerte"
            class="Emoji$1F49A$AE7 RenderedEmoji"
            src="https://a.gfx.ms/emoji_1F49A.png"
            style="height: 19px; vertical-align: middle; width: 19px;"
            title="Grønt hjerte"
          >
        </p>
      `
      const expected = '<p>💚</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an Outlook.com emoji whose filename starts with a capital', async () => {
      const value = html`
        <p>
          <img
            alt="Emoji"
            class="Emoji$1F4F7$ACA RenderedEmoji"
            src="https://a.gfx.ms/Emoji_1F4F7.png"
          >
        </p>
      `
      const expected = '<p>📷</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an Outlook.com emoji padded with a leading zero', async () => {
      const value = html`
        <p>
          <img
            alt="Svart hjerte i ultrafet type"
            class="Emoji$02764$AC5 RenderedEmoji"
            src="https://a.gfx.ms/emoji_02764.png"
          >
        </p>
      `
      const expected = '<p>❤️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace an Outlook.com emoji behind a Google image proxy', async () => {
      const value = html`
        <p>
          <img
            src="https://ci4.googleusercontent.com/proxy/PaRJ92T8k1qPRT8Dx23aVT_Oubn3YpC2-6ErPeZp4l9ASpwlthzF5usC38NNKhG64hRRqBre=s0-d-e1-ft#https://a.gfx.ms/Emoji_1F610.png"
            alt="Emoji"
          >
        </p>
      `
      const expected = '<p>😐</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a Hotmail emoji by its codepoint filename', async () => {
      const value = html`
        <p>
          <img
            alt="Black heart (cards)"
            class="Emoji$02665$1545"
            src="http://gfx1.hotmail.com/mail/w4/pr04/ltr/emoji/emoji_02665.gif"
            title="Black heart (cards)"
          >
        </p>
      `
      const expected = '<p>♥️</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('sad paths', () => {
    it('should leave the Outlook.com filename on another host untouched', async () => {
      const value = '<p><img src="https://example.com/a.gfx.ms/emoji_1F49A.png" alt=""></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave the Hotmail path on another host untouched', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/mail/w4/pr04/ltr/emoji/emoji_02665.gif"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should leave a Hotmail image outside the emoji folder untouched, constructed', async () => {
      const value = '<p><img src="http://gfx1.hotmail.com/mail/w4/pr04/ltr/i_logo.gif" alt=""></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should mark an Outlook.com file that names no codepoint', async () => {
      const value = '<p><img src="https://a.gfx.ms/Emoji_1F3A7_27.png" alt=""></p>'
      const expected = '<p><img data-emoji="" src="https://a.gfx.ms/Emoji_1F3A7_27.png" alt=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
