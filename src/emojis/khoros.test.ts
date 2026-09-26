import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('khorosEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace the element by the CLDR name in its title', async () => {
    const value = '<p>Thanks <LI-EMOJI id="lia_red-heart" title=":red_heart:"></LI-EMOJI></p>'
    const expected = '<p>Thanks ❤️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should read the id when the title is localized', async () => {
    const value =
      '<p><LI-EMOJI id="lia_backhand-index-pointing-right" title=":反手食指指向右侧:"></LI-EMOJI></p>'
    const expected = '<p>👉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark the title of an element no name resolves as fallback text', async () => {
    const value = '<p><LI-EMOJI id="lia_kudo" title=":kudo:"></LI-EMOJI></p>'
    const expected = '<p><span data-emoji="">:kudo:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark the id as fallback text when there is no title', async () => {
    const value = '<p><LI-EMOJI id="lia_kudo"></LI-EMOJI></p>'
    const expected = '<p><span data-emoji="">:kudo:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
