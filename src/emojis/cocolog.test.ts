import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('cocologEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a pictogram', async () => {
    const value = '<p><img src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'
    const expected =
      '<p><img data-emoji="" src="https://emojies.cocolog-nifty.com/emoticon/shine.gif"></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram with the emoticon class from a Cocolog copy of the set', async () => {
    const value = html`
      <p>
        <img
          class="emoticon"
          src="https://app.cocolog-nifty.com/.shared-cocolog/images/emoticon/hug.gif"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="emoticon"
          src="https://app.cocolog-nifty.com/.shared-cocolog/images/emoticon/hug.gif"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a TypePad pictogram from another host', async () => {
    const value = html`
      <p>
        <img
          class="emoticon shine"
          src="https://static.example.com/.shared/images/emoticon/shine.gif"
          alt="shine"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="emoticon shine"
          src="https://static.example.com/.shared/images/emoticon/shine.gif"
          alt="shine"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a TypePad pictogram from the WordPress plugin', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/wp-content/plugins/typepad-emoji-for-tinymce/icons/06/heart02.gif"
          width="16"
          height="16"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/wp-content/plugins/typepad-emoji-for-tinymce/icons/06/heart02.gif"
          width="16"
          height="16"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the Movable Type EmoticonButton plugin', async () => {
    const value = html`
      <p>
        <img
          class="emoticon happy01"
          src="https://example.com/mt-static/plugins/EmoticonButton/images/emoticons/happy01.gif"
          alt="happy01"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          class="emoticon happy01"
          src="https://example.com/mt-static/plugins/EmoticonButton/images/emoticons/happy01.gif"
          alt="happy01"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a pictogram from the Movable Type MTEntryFlex plugin', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/mt-static/plugins/MTEntryFlex/fckeditor/editor/images/smiley/typepad/virgo.gif"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://example.com/mt-static/plugins/MTEntryFlex/fckeditor/editor/images/smiley/typepad/virgo.gif"
          alt=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a TypePad pictogram served as an uploaded asset', async () => {
    const value = html`
      <p>
        <img
          alt="fuji"
          class="emoticon fuji  at-xid-6a0120a641efc6970b0133ecfbb9d8970b"
          src="https://example.typepad.jp/.a/6a0120a641efc6970b0133ecfbb9d8970b-pi"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          alt="fuji"
          class="emoticon fuji  at-xid-6a0120a641efc6970b0133ecfbb9d8970b"
          src="https://example.typepad.jp/.a/6a0120a641efc6970b0133ecfbb9d8970b-pi"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an uploaded asset with no pictogram name untouched', async () => {
    const value = html`
      <p>
        <img
          alt="photo"
          class="emoticon photo  at-xid-6a0120a641efc6970b0133ecfbb9d8970b"
          src="https://example.typepad.jp/.a/6a0120a641efc6970b0133ecfbb9d8970b-pi"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
