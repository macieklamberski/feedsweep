import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('shervnetEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked emoticon', async () => {
    const value = html`
      <p>
        <img
          alt="referee red card smiley"
          src="http://www.sherv.net/cm/emoticons/football/referee-red-card-smiley-emoticon.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="referee red card smiley"
          src="http://www.sherv.net/cm/emoticons/football/referee-red-card-smiley-emoticon.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon from the emo folder', async () => {
    const value = html`
      <p>
        <img
          alt="dancing monkey emoticon"
          src="http://www.sherv.net/cm/emo/dancing/monkey.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="dancing monkey emoticon"
          src="http://www.sherv.net/cm/emo/dancing/monkey.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep an emoticon whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          alt="😀"
          src="http://www.sherv.net/cm/emoticons/football/referee-red-card-smiley-emoticon.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="😀"
          src="http://www.sherv.net/cm/emoticons/football/referee-red-card-smiley-emoticon.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoticons folder on another host untouched', async () => {
    const value = html`
      <p>
        <img
          alt="referee red card smiley"
          src="https://example.com/cm/emoticons/football/referee-red-card-smiley-emoticon.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
