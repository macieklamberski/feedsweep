import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('ucozEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a uCoz smilie outside a smilie directory by its shortcode alt', async () => {
    const value = html`
      <p>
        <img
          rel="usm"
          src="https://example.com/sml/46.gif"
          align="absmiddle"
          alt=":)"
        >
      </p>
    `
    const expected = '<p>🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a uCoz smilie by its stock filename', async () => {
    const value = html`
      <p>
        <img
          rel="usm"
          src="https://example.com/smile/wink.gif"
          alt="wink"
        >
      </p>
    `
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should keep a uCoz smilie with an ambiguous code as a marked picture', async () => {
    const value = html`
      <p>
        <img
          rel="usm"
          src="https://example.com/sml/kozak.gif"
          alt=":kozak:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          rel="usm"
          src="https://example.com/sml/kozak.gif"
          alt=":kozak:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image from the same directory without rel="usm" untouched', async () => {
    const value = '<p><img src="https://example.com/sml/46.gif" alt="46"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
