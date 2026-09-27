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

    it.each(hostCases)('should mark the emoticon at %s', async (src) => {
      const value = `<p>Hello <img border="0" src="${src}"></p>`
      const expected = `<p>Hello <img data-emoji="" border="0" src="${src}"></p>`

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave the emoticon path on a host outside Yahoo untouched', async () => {
      const value = '<p><img src="https://example.com/i/mesg/emoticons7/1.gif"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })
  })

  describe('file numbers', () => {
    // Codes another engine reads as a different emoticon, on Yahoo's own drawings.
    const numberCases: Array<[number, string]> = [
      [5, ';;)'],
      [6, '&gt;:D&lt;'],
      [8, ':x'],
      [9, ':"&gt;'],
      [14, 'X('],
      [24, '=))'],
      [32, ':-$'],
      [39, ':-?'],
      [108, ':o3'],
      [109, 'X_X'],
      [113, ':-bd'],
    ]

    it.each(numberCases)('should mark number %d with its %s alt', async (number, alt) => {
      const value = html`
        <p>
          <img
            alt="${alt}"
            src="http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons7/${number}.gif"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            alt="${alt}"
            src="http://us.i1.yimg.com/us.yimg.com/i/mesg/emoticons7/${number}.gif"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  describe('exact hints', () => {
    it('should replace a number by its universal code alt', async () => {
      const value = '<p><img alt=":)" src="https://s.yimg.com/lq/i/mesg/emoticons7/1.gif"></p>'
      const expected = '<p>🙂</p>'

      expect(await transform(value)).toEqualHtml(expected)
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

  describe('marked sets', () => {
    const markedCases: Array<[string, string]> = [
      ['Mail', 'https://s.yimg.com/ok/u/assets/img/emoticons/emo3.gif'],
      ['Messenger on the forum host', 'https://s.yimg.com/pu/emoticon/v2/4.gif'],
    ]

    it.each(markedCases)('should mark the %s emoticon', async (_set, src) => {
      const value = html`
        <p>
          <img
            alt="*;) winking"
            src="${src}"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            alt="*;) winking"
            src="${src}"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave a Messenger image outside the emoticon directory untouched', async () => {
    const value = '<p><img src="http://mail.yimg.com/us.yimg.com/i/mesg/icons/buzz.gif"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should replace a Yahoo emoji named by its codepoint', async () => {
    const value =
      '<p><img src="https://s.yimg.com/nq/yemoji_assets/latest/yemoji_assets/1f600.png"></p>'
    const expected = '<p>😀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  const folderCases: Array<string> = [
    'http://us.i1.yimg.com/us.yimg.com/i/mesg/tsmileys2/40.gif',
    'http://us.i1.yimg.com/us.yimg.com/i/us/msg/emoticons/1.gif',
    'https://l.yimg.com/op/blog/images/emoticon/1.gif',
    'https://tw.yimg.com/f/i/tw/blog/smiley/1.gif',
  ]

  it.each(folderCases)('should mark an emoticon from %s', async (src) => {
    const value = `<p><img src="${src}"></p>`

    expect(await transform(value)).toEqualHtml(`<p><img src="${src}" data-emoji=""></p>`)
  })

  it('should replace an emoticon from the smaller set by its universal code alt', async () => {
    const value =
      '<p><img src="http://us.i1.yimg.com/us.yimg.com/i/mesg/tsmileys2/01.gif" alt=":)"></p>'

    expect(await transform(value)).toEqualHtml('<p>🙂</p>')
  })
})
