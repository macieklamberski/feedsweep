import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('punbbEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a pack image by its shortcode alt', async () => {
    const value = '<p><img src="https://example.com/extensions/nya_smiles/img/ad.gif" alt=";)"></p>'
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a Kolobok code alt untouched', async () => {
    const value = '<p><img src="https://example.com/extensions/pan_smiles/img/ab.gif" alt="ab"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should leave a Kolobok file named like a codepoint untouched', async () => {
    const value = '<p><img src="https://example.com/extensions/k_smiles/img/ae.gif" alt="ae"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
