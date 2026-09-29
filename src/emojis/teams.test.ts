import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('teamsEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon whose alt is no glyph', async () => {
    const value = html`
      <p>
        <img
          src="https://statics.teams.cdn.office.net/evergreen-assets/personal-expressions/v1/assets/emoticons/custom/default/20_f.png"
          alt="Custom"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://statics.teams.cdn.office.net/evergreen-assets/personal-expressions/v1/assets/emoticons/custom/default/20_f.png"
          alt="Custom"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should convert an emoticon whose folder leads with its codepoint', async () => {
    const value = html`
      <p>
        <img
          src="https://statics.teams.cdn.office.net/evergreen-assets/personal-expressions/v2/assets/emoticons/1f36b_chocolatebar/default/50_f.png?v=v15"
          alt="Chocolat"
        >
      </p>
    `
    const expected = '<p>🍫</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
