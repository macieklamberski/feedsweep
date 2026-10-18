import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

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

  it('should replace the element by the gemoji glyph of a name the shortcode table draws apart', async () => {
    const value = '<p><LI-EMOJI id="lia_smile" title=":smile:"></LI-EMOJI></p>'
    const expected = '<p>😄</p>'

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

describeForEachParser('khorosImageEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('Khoros / Lithium (/i/smilies/ stock faces)', () => {
    // The alt and title are translated per board, so the stock filename is the only stable key.
    it('should mark a stock face', async () => {
      const value = html`
        <p>
          <img
            id="smiley-happy"
            class="emoticon emoticon-smiley-happy"
            src="https://example.com/i/smilies/16x16_smiley-happy.png"
            alt="Smiley heureux"
            title="Smiley heureux"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            id="smiley-happy"
            class="emoticon emoticon-smiley-happy"
            src="https://example.com/i/smilies/16x16_smiley-happy.png"
            alt="Smiley heureux"
            title="Smiley heureux"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // The set also draws each expression on a cat, a man, a woman and a robot. Unicode's cat
    // faces cover the three smiles but not a winking or tongue-out one, so swapping those would
    // change the expression.
    const keptCases: Array<[string, string]> = [
      ['cat', '16x16_cat-wink'],
      ['woman', '16x16_woman-happy'],
      ['robot', '16x16_robot-lol'],
    ]

    it.each(keptCases)('should leave the %s variant with its picture', async (_species, name) => {
      const value = `<p><img class="emoticon" src="https://example.com/i/smilies/${name}.png" alt="Wink"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // Some boards replace the stock art with a licensed set whose files are numbered, leaving
    // nothing in the markup that names the picture.
    it('should leave a board-specific replacement set with its picture', async () => {
      const value = html`
        <p>
          <img
            class="emoticon emoticon-ClinDoeil"
            src="https://example.com/images/smilies/emoji_licence_46.png"
            alt=""
          >
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should mark a face with no counterpart by its emoticon- class', async () => {
      const value = html`
        <p>
          <img
            id="womanwink"
            class="emoticon emoticon-womanwink"
            src="https://example.com/i/smilies/16x16_woman-wink.png"
            alt="Woman Wink"
            title="Woman Wink"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            id="womanwink"
            class="emoticon emoticon-womanwink"
            src="https://example.com/i/smilies/16x16_woman-wink.png"
            alt="Woman Wink"
            title="Woman Wink"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave an image whose class only contains emoticon- untouched', async () => {
      const value = html`
        <p>
          <img
            class="emoticon-img"
            src="https://example.com/img/sticker.png"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(value)
    })

    it('should mark a face that lost its class by the name behind its size prefix', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/i/smilies/16x16_smiley-sad.png"
            alt="Smiley triste"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/i/smilies/16x16_smiley-sad.png"
            alt="Smiley triste"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Vodafone's copy of the set is sized 15x15.
    it('should mark a face from the 15x15 set by the name behind its size prefix', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/html/@929CB104E9842E64CFFA4DDBA9219E92/images/emoticons/15x15_smiley-wink.gif"
            alt=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/html/@929CB104E9842E64CFFA4DDBA9219E92/images/emoticons/15x15_smiley-wink.gif"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a Samsung emoji by the codepoint in its numbered filename', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@1BBE730D66F6AF8A8EB16B462DAF441D/images/smilies/2.winking-face_1f609.png"
            alt=":winking-face:"
            title=":winking-face:"
          >
        </p>
      `
      const expected = '<p>😉</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace a Samsung emoji with a skin tone by its full sequence', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@684C5748BA1AA2FD7E2E3E73F2D23AAF/images/smilies/10.thumbs-up-sign_emoji-modifier-fitzpatrick-type-1-2_1f44d-1f3fb_1f3fb.png"
            alt=":thumbs-up-sign-emoji-modifier-fitzpatrick-type:"
            title=":thumbs-up-sign-emoji-modifier-fitzpatrick-type:"
          >
        </p>
      `
      const expected = '<p>👍🏻</p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Samsung's own smiling face is filed under the codepoint of 🃏.
    it('should mark the Samsung smiling face without decoding its filename', async () => {
      const value = html`
        <p>
          <img
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@758C9CF82B69C1E7230907A98BEAE742/images/smilies/1.samsung_1f0cf.png"
            alt=":smiling-face:"
            title=":smiling-face:"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="lia-deferred-image lia-image-emoji"
            src="https://example.com/html/@758C9CF82B69C1E7230907A98BEAE742/images/smilies/1.samsung_1f0cf.png"
            alt=":smiling-face:"
            title=":smiling-face:"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = html`
        <p>Hi
          <img
            class="emoticon emoticon-smileywink"
            src="https://example.com/i/smilies/16x16_smiley-wink.png"
            alt="Smiley clignant"
          >
        </p>
      `
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })
})
