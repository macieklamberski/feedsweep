import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('sapoEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon from the sapoemoticons plugin', async () => {
    const value = html`
      <p>
        <img
          height="32"
          src="https://example.com/tinymce4/plugins/sapoemoticons/img/EMOTICON_2020_BLINK.png"
          width="32"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          height="32"
          src="https://example.com/tinymce4/plugins/sapoemoticons/img/EMOTICON_2020_BLINK.png"
          width="32"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon from the sapoemotions plugin', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/tinymce/0.2/plugins/sapoemotions/img/EMOTICON_ANGRY.png"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/tinymce/0.2/plugins/sapoemotions/img/EMOTICON_ANGRY.png"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  // The plugin folder also holds the editor's own interface icons.
  it('should leave an interface icon from the plugin folder untouched', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/tinymce/0.2/plugins/sapoemotions/img/SHOW_CHAT.png"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
