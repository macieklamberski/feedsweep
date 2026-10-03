import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('phpbbEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  // The board shipped the template variable unsubstituted, so the src is a placeholder no host
  // serves, and the code stands in for the picture.
  it('should give the code of a smilie whose path is the raw placeholder', async () => {
    const value = html`
      <p>
        <img
          src="{SMILIES_PATH}/teeth_smile.gif"
          alt=":D"
          title="Very Happy"
        >
      </p>
    `
    const expected = '<p><span data-emoji="">:D</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should give the code of a smilie whose placeholder arrived percent-encoded', async () => {
    const value = html`
      <p>
        <img
          src="%7BSMILIES_PATH%7D/wink_smile.gif"
          alt=";)"
        >
      </p>
    `
    const expected = '<p><span data-emoji="">;)</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should give the code of a placeholder smilie no table knows', async () => {
    const value = html`
      <p>
        <img
          src="%7BSMILIES_PATH%7D/borracho.gif"
          alt="(borracho)"
          title="Borracho"
        >
      </p>
    `
    const expected = '<p><span data-emoji="">(borracho)</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // A stock name with a glyph still gives its code, since phpBB's set keeps its pictures.
  it('should give the code of a placeholder smilie with a stock name', async () => {
    const value = html`
      <p>
        <img
          src="{SMILIES_PATH}/icon_smile.gif"
          alt=":)"
          title="Smile"
        >
      </p>
    `
    const expected = '<p><span data-emoji="">:)</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  // Resolved against the page url, the placeholder could be any image, and a stock name marks it.
  it('should mark a stock smilie whose placeholder was resolved against the page url', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/%7BSMILIES_PATH%7D/icon_rolleyes.gif"
          alt=":roll:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/%7BSMILIES_PATH%7D/icon_rolleyes.gif"
          alt=":roll:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
