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

  it('should replace a smilie from the uCoz smilie host without rel="usm"', async () => {
    const value = '<p><img src="http://src.ucoz.ru/sm/24/smile.gif" border="0" alt="smile"></p>'

    expect(await transform(value)).toEqualHtml('<p>🙂</p>')
  })

  it('should keep an unmapped smilie from the uCoz smilie host as a marked picture', async () => {
    const value = '<p><img src="http://src.ucoz.net/sm/1/kozak.gif" alt="kozak"></p>'
    const expected =
      '<p><img data-emoji="" src="http://src.ucoz.net/sm/1/kozak.gif" alt="kozak"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a smilie from a numbered uCoz host', async () => {
    const value = '<p><img src="http://s34.ucoz.net/sm/1/smile.gif" border="0" alt="smile"></p>'

    expect(await transform(value)).toEqualHtml('<p>🙂</p>')
  })

  it('should replace a smilie from a site copy of the uCoz sets', async () => {
    const value = '<p><img src="https://example.com/.s/sm/2/smile.gif" border="0" alt="smile"></p>'

    expect(await transform(value)).toEqualHtml('<p>🙂</p>')
  })
})
