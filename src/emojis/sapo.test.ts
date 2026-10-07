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

  it('should mark an emoticon from the older editor', async () => {
    const value = html`
      <p>
        <img
          src="https://blogs.example.com/stc/fckeditor/editor/images/smiley/sapo/EMOTICON_CONFUSED.png"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://blogs.example.com/stc/fckeditor/editor/images/smiley/sapo/EMOTICON_CONFUSED.png"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a mood icon from the older editor untouched', async () => {
    const value = html`
      <p>
        <img
          src="https://blogs.example.com/stc/fckeditor/editor/images/smiley/sapo/MOOD_SAPO_TIRED.png"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
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

  it('should mark a mood emoticon', async () => {
    const value = '<p><img alt="" src="https://blogs.sapo.pt/images/mood/EMOTICON_LIPS.png"></p>'
    const expected =
      '<p><img data-emoji="" alt="" src="https://blogs.sapo.pt/images/mood/EMOTICON_LIPS.png"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a mood image that is not an emoticon untouched', async () => {
    const value = '<p><img alt="" src="https://blogs.sapo.pt/images/mood/banner.png"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })

  it('should keep an emoticon whose alt is an emoji as a marked picture', async () => {
    const value = html`
      <p>
        <img
          height="32"
          src="https://example.com/tinymce4/plugins/sapoemoticons/img/EMOTICON_2020_BLINK.png"
          width="32"
          alt="😀"
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
          alt="😀"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
