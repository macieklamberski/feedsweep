import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('sweetimEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a hotlinked emoticon', async () => {
    const value = html`
      <p>
        <img
          border="0"
          src="http://content.sweetim.com/sim/cpie/emoticons/0002031F.gif"
          title="Click to get more."
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          border="0"
          src="http://content.sweetim.com/sim/cpie/emoticons/0002031F.gif"
          title="Click to get more."
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon hotlinked from the CDN host', async () => {
    const value = html`
      <p>
        <img
          border="0"
          src="http://cdn.content.sweetim.com/sim/cpie/emoticons/000202CD.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          border="0"
          src="http://cdn.content.sweetim.com/sim/cpie/emoticons/000202CD.gif"
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
          src="http://content.sweetim.com/sim/cpie/emoticons/0002031F.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="😀"
          src="http://content.sweetim.com/sim/cpie/emoticons/0002031F.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoticons folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/sim/cpie/emoticons/0002031F.gif"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
