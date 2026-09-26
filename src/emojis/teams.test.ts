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
})
