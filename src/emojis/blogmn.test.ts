import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('blogmnEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const smilieCases: Array<[string, string]> = [
    ['http://www.blogmn.net/images/smiles/1.gif', 'баярлах'],
    ['http://www.blogmn.net/images/smiles/4.gif', 'big grin'],
    ['http://www.blogmn.net/images/smiles/0134.gif', 'гоё шүү'],
    ['https://blogmn.net/images/smiles/0423.gif', '0423'],
    ['http://desert.blogmn.net/images/smiles/7.gif', ''],
    ['https://tusgal.coo.mn/images/smiles/26.gif', 'nerd'],
    ['http://help.dusal.net/images/smiles/1.gif', 'баярлах'],
    ['http://www.blog.dusal.net/images/smiles/25.gif', 'angel'],
  ]

  it.each(smilieCases)('should mark %s', async (src, alt) => {
    const value = html`
      <p>
        <img
          src="${src}"
          alt="${alt}"
          border="0"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="${src}"
          alt="${alt}"
          border="0"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a smilie whose alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          src="http://www.blogmn.net/images/smiles/1.gif"
          alt="🙂"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="http://www.blogmn.net/images/smiles/1.gif"
          alt="🙂"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  const lookalikeCases: Array<string> = [
    'https://example.com/images/smiles/1.gif',
    'https://example-coo.mn/images/smiles/1.gif',
  ]

  it.each(lookalikeCases)('should leave %s untouched', async (src) => {
    const value = html`
      <p>
        <img
          src="${src}"
          alt="баярлах"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
