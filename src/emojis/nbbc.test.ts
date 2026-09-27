import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('nbbcEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  describe('NBBC (bbcode_smiley class, /smileys/ names)', () => {
    // NBBC writes its code as the alt, and these four mean another face in the shared table.
    const faceCases: Array<[string, string]> = [
      ['worry', ':s'],
      ['bigeyes', '8)'],
      ['bigwink', ';D'],
      ['lookleft', '&lt;_&lt;'],
    ]

    it.each(faceCases)('should mark the %s face', async (name, code) => {
      const value = html`
        <p>
          <img
            src="https://example.com/nbbc/smileys/${name}.gif"
            width="15"
            height="15"
            alt="${code}"
            title="${code}"
            class="bbcode_smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/nbbc/smileys/${name}.gif"
            width="15"
            height="15"
            alt="${code}"
            title="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // Without the class and a code alt, the file name alone says which face it is.
    it('should mark a face whose image lost its class', async () => {
      const value = '<p><img src="https://example.com/nbbc/smileys/bigeyes.gif" alt=""></p>'
      const expected =
        '<p><img data-emoji="" src="https://example.com/nbbc/smileys/bigeyes.gif" alt=""></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })

    const markedCodeCases: Array<string> = [
      '&gt;;)',
      'O:)',
      '^_^',
      '^^;',
      '&gt;_&gt;',
      '&lt;g&gt;',
      'o.O',
    ]

    it.each(markedCodeCases)('should mark the %s code on a renamed file', async (code) => {
      const value = html`
        <p>
          <img
            src="https://example.com/nbbc/smileys/custom/8.gif"
            alt="${code}"
            class="bbcode_smiley"
          >
        </p>
      `
      const expected = html`
        <p>
          <img
            data-emoji=""
            src="https://example.com/nbbc/smileys/custom/8.gif"
            alt="${code}"
            class="bbcode_smiley"
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    // A base64 payload can end in a slash and an NBBC name.
    it('should not read an NBBC name out of a sprite payload', async () => {
      const value = html`
        <p>
          <img
            src="data:image/gif;base64,AAA/worry"
            data-shortname=":totally_custom:"
          >
        </p>
      `
      const expected = '<p><span data-emoji="">:totally_custom:</span></p>'

      expect(await transform(value)).toEqualHtml(expected)
    })
  })
})
