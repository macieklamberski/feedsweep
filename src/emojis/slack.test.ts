import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('slackEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji whose alt is a shortcode by its filename', async () => {
    const value = html`
      <p>Done
        <img
          src="https://a.slack-edge.com/production-standard-emoji-assets/14.0/google-medium/2714-fe0f.png"
          alt=":heavy_check_mark:"
          data-stringify-emoji=":heavy_check_mark:"
        >
      </p>
    `
    const expected = '<p>Done ✔️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji with no alt from its high-resolution filename', async () => {
    const value = html`
      <p>
        <img src="https://a.slack-edge.com/production-standard-emoji-assets/13.0/apple-medium/2728@2x.png">
      </p>
    `
    const expected = '<p>✨</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an emoji whose alt is already the glyph', async () => {
    const value = html`
      <p>
        <img
          src="https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-medium/1f449.png"
          alt="👉"
        >
      </p>
    `
    const expected = '<p>👉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })
})
