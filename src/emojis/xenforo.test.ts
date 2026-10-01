import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('xenforoEmojiResolver', (parseHtml) => {
  const { transform, transformKeeping } = emojiConverters(parseHtml)

  describe('XenForo (sprite smilies: data-URI src + data-shortname)', () => {
    // The src is the 1x1 transparent GIF XenForo paints its sprite sheet behind, so these
    // render as nothing in a reader. Kept verbatim from a real feed.
    const spriteSource =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

    // The picture renders nothing, so the set's code stands in for it, even a universal one.
    it('should keep a sprite smilie as its code text', async () => {
      const value = html`
        <p>Eigenwerbung...
          <img
            src="${spriteSource}"
            class="smilie smilie--sprite smilie--sprite8"
            alt=":D"
            title="Big grin    :D"
            loading="lazy"
            data-shortname=":D"
          >
        </p>
      `
      const expected = '<p>Eigenwerbung... <span data-emoji="">:D</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Pre-2.2 boards and modified templates omit data-shortname, and the alt names it instead.
    it('should keep the alt of a sprite smilie with no data-shortname as text', async () => {
      const value = `<p><img src="${spriteSource}" class="smilie smilie--sprite" alt=":D"></p>`
      const expected = '<p><span data-emoji="">:D</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a sprite smilie untouched when nothing names it', async () => {
      const value = `<p><img src="${spriteSource}" class="smilie smilie--sprite"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave an inlined data-URI image untouched when it is too long to be a spacer', async () => {
      const value = `<p><img src="data:image/png;base64,${'A'.repeat(300)}" data-shortname=":D"></p>`

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    // 1.x numbers its sprites in the class and carries no data-shortname, and points src at a
    // shared transparent PNG, not a data URI.
    it('should keep a 1.x sprite named by its numbered class as its alt text', async () => {
      const value = html`
        <p>
          <img
            src="styles/default/xenforo/clear.png"
            class="mceSmilieSprite mceSmilie7"
            alt=":p"
            title="Stick Out Tongue :p"
          >
        </p>
      `
      const expected = '<p><span data-emoji="">:p</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should keep a 1.x sprite that lost its class as its alt text', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/styles/default/xenforo/clear.png"
            alt=":)"
            title="Smile    :)"
          >
        </p>
      `
      const expected = '<p><span data-emoji="">:)</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should leave a clear.png outside a XenForo style untouched', async () => {
      const value = '<p><img src="https://example.com/images/clear.png" alt=":)"></p>'

      expect(await transform(value)).toEqualHtml(value)
    })

    // The theme directory differs per board, so the `smilies` directory is what identifies a
    // self-hosted set.
    it('should mark a self-hosted XenForo smilie from its theme directory', async () => {
      const value = html`
        <p>
          <img
            src="https://example.com/styles/default/xenforo/smilies/smile.png"
            class="smilie"
            alt=":)"
            data-shortname=":)"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/styles/default/xenforo/smilies/smile.png"
            class="smilie"
            alt=":)"
            data-shortname=":)"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should preserve position when the sprite is nested inside an anchor', async () => {
      const value = `<p><a href="/x">nice <img src="${spriteSource}" data-shortname=":)"> work</a></p>`
      const expected = '<p><a href="/x">nice <span data-emoji="">:)</span> work</a></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should be idempotent', async () => {
      const value = `<p>Hi <img src="${spriteSource}" data-shortname=":D" alt=":D"></p>`
      const once = await transform(value)
      const twice = await transform(once)

      expect(twice).toEqualHtml(once)
    })
  })

  describe('XenForo 2 (sprite shortnames)', () => {
    // Codes each engine draws as its own face. The sprite renders nothing, so the code stays as
    // text.
    const shortnameCases: Array<[string, string]> = [
      [':cautious:', 'Cautious'],
      [':censored:', 'Censored'],
      [':sneaky:', 'Sneaky'],
      [':whistle:', 'Whistling'],
      [':giggle:', 'Giggle'],
      [':devilish:', 'Devil'],
      ['o_O', 'Er... what?'],
    ]

    it.each(shortnameCases)(
      'should keep the %s smilie as its shortname',
      async (shortname, title) => {
        const value = html`
        <p>
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            class="smilie smilie--sprite smilie--sprite9"
            alt="${shortname}"
            title="${title}    ${shortname}"
            loading="lazy"
            data-shortname="${shortname}"
          >
        </p>
      `
        const expected = `<p><span data-emoji="">${shortname}</span></p>`

        expect(await transform(value)).toEqualHtml(expected)
      },
    )

    // phpBB boards bind `O_o` to faces of their own, and only XenForo's is drawn dizzy.
    it('should mark an O_o smilie outside XenForo', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/icon_goofy.gif"
            alt="O_o"
            title="Flipando"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/icon_goofy.gif"
            alt="O_o"
            title="Flipando"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
