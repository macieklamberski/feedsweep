import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('rhymixEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark a numbered emoticon', async () => {
    const value = html`
      <p>
        <img
          src="https://example.com/modules/editor/components/emoticon/tpl/images/msn/msn012.gif"
          alt="msn012.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          src="https://example.com/modules/editor/components/emoticon/tpl/images/msn/msn012.gif"
          alt="msn012.gif"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a numbered emoticon behind a relative path', async () => {
    const value = html`
      <p>
        <img
          src="modules/editor/components/emoticon/tpl/images/msn/msn039.gif"
          alt="emoticon"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          src="modules/editor/components/emoticon/tpl/images/msn/msn039.gif"
          alt="emoticon"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
