import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('forumotionEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should leave a Forumotion name outside its host untouched', async () => {
    const value = '<p><img src="https://example.com/images/smiles/herz.png" alt=""></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should mark an unknown name on the Forumotion host', async () => {
    const value = '<p><img src="https://illiweb.com/fa/i/smiles/icon_queen.png" alt="queen"></p>'
    const expected =
      '<p><img data-emoji="" src="https://illiweb.com/fa/i/smiles/icon_queen.png" alt="queen"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a smilie a board uploaded', async () => {
    const value =
      '<p><img src="https://example.forumactif.org/users/3512/11/85/38/smiles/640583149.gif" alt="rhum" longdesc="47"></p>'
    const expected =
      '<p><img data-emoji="" src="https://example.forumactif.org/users/3512/11/85/38/smiles/640583149.gif" alt="rhum" longdesc="47"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave another user folder with a smiles directory untouched', async () => {
    const value = '<p><img src="https://example.com/users/jan/smiles/photo.jpg" alt="Jan"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
