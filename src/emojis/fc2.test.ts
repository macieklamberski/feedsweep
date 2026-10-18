import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('fc2EmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  // One per folder FC2 serves its pictograms from, each pasted without the class.
  const folderCases: Array<string> = [
    'http://blog-imgs-1.fc2.com/emoji/2008-12-03/330763.gif',
    'http://static.fc2.com/emoji/v/356.gif',
    'http://blog-imgs-1.fc2.com/image/emoji/i/63903.gif',
    'http://blog102.fc2.com/image/icon/i/F997.gif',
    'http://static.fc2.com/image/e/348.gif',
    'http://blog-imgs-1.fc2.com/image/i/265.gif',
    'http://blog77.fc2.com/image/v/410.gif',
    'http://blog-imgs-1-origin.fc2.com/image/v/354.gif',
  ]

  it.each(folderCases)('should mark a pictogram without the class at %s', async (src) => {
    const value = `<p><img src="${src}" alt=""></p>`
    const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a pictogram without the class whose alt is an emoji as a marked picture', async () => {
    const value = `<p><img src="http://static.fc2.com/emoji/e/420.gif" alt="😀"></p>`
    const expected = `<p><img data-emoji="" src="http://static.fc2.com/emoji/e/420.gif" alt="😀"></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  const unclaimedCases: Array<string> = [
    'https://bj.fc2.com/image/banner3.gif',
    'https://blog-imgs-1.fc2.com/e/x/a/example/emoji.gif',
    'https://example.web.fc2.com/image/icon/photo.jpg',
  ]

  it.each(unclaimedCases)('should leave %s without the class untouched', async (src) => {
    const value = `<p><img src="${src}" alt=""></p>`

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should mark a pictogram whose number reads as a codepoint', async () => {
    const value = html`
      <p>
        <img
          src="//blog-imgs-1.fc2.com/emoji/2007-02-05/2640.gif"
          alt=""
          border="0"
          class="emoji"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="//blog-imgs-1.fc2.com/emoji/2007-02-05/2640.gif"
          alt=""
          border="0"
          class="emoji"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
