import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('boardgamegeekEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon with the emoticon class', async () => {
    const value = html`
      <p>
        <img
          class="emoticon"
          src="https://cf.geekdo-static.com/images/smile.gif"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          class="emoticon"
          src="https://cf.geekdo-static.com/images/smile.gif"
          alt=""
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon without a class', async () => {
    const value = html`
      <p>
        <img
          src="https://cf.geekdo-static.com/images/biggrin.gif"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          src="https://cf.geekdo-static.com/images/biggrin.gif"
          alt=""
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should convert an emoticon whose alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          src="https://cf.geekdo-static.com/images/smile.gif"
          alt="🙂"
        >
      </p>
    `
    const expected = '<p>🙂</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  const unknownCases: Array<[string, string]> = [
    ['die', 'd10-1.gif'],
    ['star', 'star_yellow.gif'],
    ['tile', 'tiles/F.gif'],
  ]

  it.each(unknownCases)('should leave a %s image untouched', async (_name, file) => {
    const value = html`
      <p>
        <img
          class="emoticon"
          src="https://cf.geekdo-static.com/images/${file}"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
