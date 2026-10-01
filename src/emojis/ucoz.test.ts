import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('ucozEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a uCoz smilie outside a smilie directory despite its universal code alt', async () => {
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
    const expected = html`
      <p>
        <img
          data-emoji=""
          rel="usm"
          src="https://example.com/sml/46.gif"
          align="absmiddle"
          alt=":)"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an image from the same directory without rel="usm" untouched', async () => {
    const value = '<p><img src="https://example.com/sml/46.gif" alt="46"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  const hostCases: Array<string> = [
    'http://src.ucoz.ru/sm/24/smile.gif',
    'http://src.ucoz.net/sm/1/kozak.gif',
    'http://s34.ucoz.net/sm/1/smile.gif',
    'https://example.com/.s/sm/2/smile.gif',
  ]

  it.each(hostCases)('should mark a smilie at %s without rel="usm"', async (src) => {
    const value = `<p><img src="${src}" alt="smile"></p>`
    const expected = `<p><img data-emoji="" src="${src}" alt="smile"></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })
})
