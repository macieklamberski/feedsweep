import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('kolobokEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const packCases: Array<[string]> = [
    ['https://example.com/portail/sites/all/modules/smiley/packs/kolobok/pardon.gif'],
    ['/sites/all/modules/smiley/packs/kolobok/pardon.gif'],
  ]

  it.each(packCases)('should mark a Drupal pack smilie from %s', async (src) => {
    const value = `<p><img src="${src}" alt="Pardon"></p>`
    const expected = `<p><img data-emoji="" src="${src}" alt="Pardon"></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a Drupal pack smilie despite its emoji alt', async () => {
    const value = html`
      <p>
        <img src="https://example.com/sites/all/modules/smiley/packs/kolobok/dirol.gif" alt="😉">
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/sites/all/modules/smiley/packs/kolobok/dirol.gif"
          alt="😉"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another Drupal pack untouched', async () => {
    const value =
      '<p><img src="https://example.com/sites/all/modules/smiley/packs/other/pardon.gif" alt="Pardon"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
