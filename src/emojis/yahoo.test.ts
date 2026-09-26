import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('yahooEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('hosts', () => {
    const hostCases: Array<string> = [
      'http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons7/1.gif',
      'http://l.yimg.com/us.yimg.com/i/mesg/emoticons7/1.gif',
      'https://s.yimg.com/lq/i/mesg/emoticons7/1.gif',
      'https://i0.wp.com/l.yimg.com/us.yimg.com/i/mesg/emoticons7/1.gif',
      'http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons6/1.gif',
    ]

    it.each(hostCases)('should replace the emoticon at %s', async (src) => {
      const value = `<p>Hello <img border="0" src="${src}"></p>`
      const expected = '<p>Hello 🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the emoticon path on a host outside Yahoo untouched', async () => {
      const value = '<p><img src="https://example.com/i/mesg/emoticons7/1.gif"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('file numbers', () => {
    // Codes another engine reads as a different emoticon, and numbers whose decided glyph differs
    // from what the code means elsewhere.
    const numberCases: Array<[number, string, string]> = [
      [5, ';;)', '😉'],
      [6, '&gt;:D&lt;', '🤗'],
      [8, ':x', '🥰'],
      [9, ':"&gt;', '😳'],
      [14, 'X(', '😡'],
      [24, '=))', '🤣'],
      [32, ':-$', '🤫'],
      [39, ':-?', '🤔'],
      [108, ':o3', '🥺'],
      [109, 'X_X', '🫣'],
      [113, ':-bd', '👍'],
    ]

    it.each(numberCases)('should replace number %d over its %s alt', async (number, alt, glyph) => {
      const value = html`
        <p>
          <img
            alt="${alt}"
            src="http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons7/${number}.gif"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(`<p>${glyph}</p>`)
    })
  })

  describe('kept pictures', () => {
    // Chatterbox, which the review kept as a picture.
    it('should mark a number decided to keep its picture', async () => {
      const value = html`
        <p>
          <img alt=":-@" src="https://s.yimg.com/lq/i/mesg/emoticons7/76.gif">
        </p>
      `
      const expected = html`
        <p>
          <img alt=":-@" src="https://s.yimg.com/lq/i/mesg/emoticons7/76.gif" data-emoji="">
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a number the table does not carry', async () => {
      const value = '<p><img src="https://s.yimg.com/lq/i/mesg/emoticons7/115.gif"></p>'
      const expected =
        '<p><img src="https://s.yimg.com/lq/i/mesg/emoticons7/115.gif" data-emoji=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a zero-padded file in the unversioned directory', async () => {
      const value = '<p><img src="http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons/03.gif"></p>'
      const expected =
        '<p><img src="http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons/03.gif" data-emoji=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave a Messenger image outside the emoticon directory untouched', async () => {
    const value = '<p><img src="http://mail.yimg.com/us.yimg.com/i/mesg/tsmileys2/03.gif"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace a Yahoo emoji named by its codepoint', async () => {
    const value =
      '<p><img src="https://s.yimg.com/nq/yemoji_assets/latest/yemoji_assets/1f600.png"></p>'
    const expected = '<p>😀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
