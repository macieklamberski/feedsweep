import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('tistoryEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a Kakao Friends sticker', async () => {
    const value =
      '<p><img src="https://t1.daumcdn.net/keditor/emoticon/friends1/large/007.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://t1.daumcdn.net/keditor/emoticon/friends1/large/007.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a Niniz sticker', async () => {
    const value =
      '<p><img src="https://t1.daumcdn.net/keditor/emoticon/niniz/large/038.gif" alt=""></p>'
    const expected =
      '<p><img data-emoji="" src="https://t1.daumcdn.net/keditor/emoticon/niniz/large/038.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another Daum CDN image untouched', async () => {
    const value = '<p><img src="https://t1.daumcdn.net/cfile/tistory/photo.jpg" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep a sticker whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          src="https://t1.daumcdn.net/keditor/emoticon/friends1/large/007.gif"
          alt="😀"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://t1.daumcdn.net/keditor/emoticon/friends1/large/007.gif"
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
