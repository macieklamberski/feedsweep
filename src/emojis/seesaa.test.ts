import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('seesaaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram from the images_g set', async () => {
    const value = '<p><img src="https://blog.seesaa.jp/images_g/1/37.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://blog.seesaa.jp/images_g/1/37.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the images_e set', async () => {
    const value = '<p><img src="https://blog.seesaa.jp/images_e/86.gif"></p>'
    const expected = '<p><img data-emoji="" src="https://blog.seesaa.jp/images_e/86.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  const folderCases: Array<string> = [
    'http://blog.seesaa.jp/images_w/emoji/i_36.gif',
    'http://blog.seesaa.jp/images_o/1139.gif',
  ]

  it.each(folderCases)('should mark the pictogram at %s', async (src) => {
    const value = `<p><img src="${src}" alt=""></p>`

    expect(await transform(value)).toEqualHtml(`<p><img src="${src}" alt="" data-emoji=""></p>`)
  })

  it('should keep a pictogram whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://blog.seesaa.jp/images_g/1/37.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://blog.seesaa.jp/images_g/1/37.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
