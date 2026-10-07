import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('kolobokEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  const hotlinkCases: Array<[string]> = [
    ['http://www.kolobok.us/smiles/standart/dntknw.gif'],
    ['http://smiles.kolobok.us/big_standart/good.gif'],
    ['https://en.kolobok.us/content_images/emotes/big_kolobok/flag_of_truce.gif'],
  ]

  it.each(hotlinkCases)('should mark a hotlinked smilie from %s', async (src) => {
    const value = `<p><img src="${src}" alt=""></p>`
    const expected = `<p><img data-emoji="" src="${src}" alt=""></p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a hotlinked smilie despite its emoji alt', async () => {
    const value = html`
      <p>
        <img src="http://www.en.kolobok.us/smiles/user/tatice_03.gif" alt="🤣">
      </p>
    `
    const expected = html`
      <p>
        <img data-emoji="" src="http://www.en.kolobok.us/smiles/user/tatice_03.gif" alt="🤣">
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a smiles folder on another host untouched', async () => {
    const value = '<p><img src="https://example.com/smiles/standart/dntknw.gif" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

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
