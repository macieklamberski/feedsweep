import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('punbbEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a pack image by its shortcode alt', async () => {
    const value = '<p><img src="https://example.com/extensions/nya_smiles/img/ad.gif" alt=";)"></p>'
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a Kolobok image without a shortcode alt', async () => {
    const value = '<p><img src="https://example.com/extensions/pan_smiles/img/ab.gif" alt="ab"></p>'
    const expected =
      '<p><img data-emoji="" src="https://example.com/extensions/pan_smiles/img/ab.gif" alt="ab"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a Kolobok file named like a hex code', async () => {
    const value = '<p><img src="https://example.com/extensions/k_smiles/img/ae.gif" alt="ae"></p>'
    const expected =
      '<p><img data-emoji="" src="https://example.com/extensions/k_smiles/img/ae.gif" alt="ae"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a pack image with an unknown name untouched', async () => {
    const value =
      '<p><img src="https://example.com/extensions/pan_smiles/img/kozak.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
