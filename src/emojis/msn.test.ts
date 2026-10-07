import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('msnEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('sets', () => {
    const setCases: Array<string> = [
      'http://spaces.live.com/rte/emoticons/smile_sad.gif',
      'https://i0.wp.com/jarabindan.spaces.live.com/mmm2006-10-27_23.09/rte/emoticons/phone.gif',
      'http://spaces.msn.com/rte/emoticons/smile_cry.gif',
      'http://shared.live.com/QGncRMHLLpIcOfCh--4aMA/emoticons/smile_cry.gif',
      'http://gfx2.hotmail.com/mail/w4/pr01/ltr/emoticons/rose.gif',
      'http://gfx2.hotmail.com/mail/w4/pr04/ltr/emo/ids_emoticon_rose.gif',
      'http://messenger.msn.com/MMM2006-04-19_17.00/Resource/emoticons/red_smile.gif',
      'https://example.com/js/fckeditor/editor/images/smiley/msn/monitor.png',
    ]

    it.each(setCases)('should mark the emoticon at %s', async (src) => {
      const value = `<p><img src="${src}" alt=""></p>`
      const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should mark an emoticon behind an image proxy', async () => {
    const value = html`
      <p>
        <img
          alt="smile_sad"
          src="https://i0.wp.com/spaces.live.com/rte/emoticons/smile_sad.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="smile_sad"
          src="https://i0.wp.com/spaces.live.com/rte/emoticons/smile_sad.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep the picture when the alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          alt="🙂"
          src="https://example.com/fckeditor/editor/images/smiley/msn/regular_smile.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="🙂"
          src="https://example.com/fckeditor/editor/images/smiley/msn/regular_smile.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave the Spaces path on another host untouched', async () => {
    const value = '<p><img src="https://example.com/rte/emoticons/smile_sad.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave the Hotmail path on another host untouched', async () => {
    const value =
      '<p><img src="https://example.com/mail/w4/pr04/ltr/emo/ids_emoticon_rose.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave the Messenger path on another host untouched', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/MMM2006-04-19_17.00/Resource/emoticons/red_smile.gif"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
