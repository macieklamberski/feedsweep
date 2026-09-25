import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('gitlabEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace the element with the glyph it holds', async () => {
    const value = html`
      <p>Fixed
        <gl-emoji
          title="white heavy check mark"
          data-name="white_check_mark"
          data-unicode-version="6.0"
        >✅</gl-emoji>
      </p>
    `
    const expected = '<p>Fixed ✅</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace an empty element by its name when the table carries it', async () => {
    const value = '<p><gl-emoji data-name="wink"></gl-emoji></p>'
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark the name of an empty element as fallback text', async () => {
    const value = '<p><gl-emoji data-name="tanuki"></gl-emoji></p>'
    const expected = '<p><span data-emoji="">:tanuki:</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark text that is not an emoji as fallback text', async () => {
    const value = '<p><gl-emoji data-name="tanuki">[tanuki]</gl-emoji></p>'
    const expected = '<p><span data-emoji="">[tanuki]</span></p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  describe('custom emoji', () => {
    it('should replace an empty element with a marked image of fallback-src', async () => {
      const value = html`
        <p>
          <gl-emoji
            title="partyparrot"
            data-name="partyparrot"
            data-fallback-src="https://example.com/uploads/-/system/custom_emoji/1/partyparrot.gif"
            data-unicode-version="custom"
          ></gl-emoji>
        </p>
      `
      const expected = html`
        <p>
          <img
            src="https://example.com/uploads/-/system/custom_emoji/1/partyparrot.gif"
            alt=":partyparrot:"
            data-emoji=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })

    it('should replace the image GitLab wraps with a marked image of fallback-src', async () => {
      const value = html`
        <p>
          <gl-emoji
            title="partyparrot"
            data-name="partyparrot"
            data-fallback-src="https://example.com/uploads/-/system/custom_emoji/1/partyparrot.gif"
            data-unicode-version="custom"
          ><img
            class="emoji"
            src="https://example.com/uploads/-/system/custom_emoji/1/partyparrot.gif"
            alt=":partyparrot:"
            title=":partyparrot:"
            height="20"
            align="absmiddle"
          ></gl-emoji>
        </p>
      `
      const expected = html`
        <p>
          <img
            src="https://example.com/uploads/-/system/custom_emoji/1/partyparrot.gif"
            alt=":partyparrot:"
            data-emoji=""
          >
        </p>
      `

      expect(await transform(value)).toEqualHtml(expected)
    })
  })

  it('should leave an element with neither text nor a name untouched', async () => {
    const value = '<p>a <gl-emoji></gl-emoji> b</p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
