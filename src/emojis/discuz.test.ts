import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('discuzEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('Discuz! (static/image/smiley/ names)', () => {
    const faceNames: Array<string> = [
      'huffy',
      'titter',
      'sweat',
      'loveliness',
      'funk',
      'curse',
      'shutup',
      'hug',
      'victory',
      'time',
      'handshake',
      'call',
    ]

    it.each(faceNames)('should mark the %s face', async (name) => {
      const value = html`
        <p>
          <img
            src="https://example.com/static/image/smiley/default/${name}.gif"
            smilieid="14"
            border="0"
            alt=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/static/image/smiley/default/${name}.gif"
            smilieid="14"
            border="0"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should mark a phpBB smilie that shares a Discuz name', async () => {
      const value = html`
        <p>
          <img
            class="smilies"
            src="https://example.com/images/smilies/time.gif"
            alt=""
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            class="smilies"
            src="https://example.com/images/smilies/time.gif"
            alt=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should mark an unmapped Discuz smilie by its smilieid attribute', async () => {
    const value = html`
      <p>
        <img
          alt=""
          src="https://example.com/images/smilies/default/run.gif"
          smilieid="52"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt=""
          src="https://example.com/images/smilies/default/run.gif"
          smilieid="52"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
