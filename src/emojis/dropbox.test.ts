import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('dropboxEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an emoji by the character it holds', async () => {
    const value = html`
      <p>
        <img
          title="office building"
          src="https://paper.dropboxstatic.com/static/img/ace/emoji/1f3e2.png?version=7.0.1"
          alt="office building"
          height="16"
          data-emoji-ch="🏢"
        >
      </p>
    `
    const expected = '<p>🏢</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should decode the filename when the character is garbled', async () => {
    const value = html`
      <p>
        <img
          title="winking face"
          src="https://paper.dropboxstatic.com/static/img/ace/emoji/1f609.png?version=6.0.0"
          alt="winking face"
          data-emoji-ch="????"
        >
      </p>
    `
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a sequence whose filename drops the joiner', async () => {
    const value = html`
      <p>
        <img src="https://paper.dropboxstatic.com/static/img/ace/emoji/1f9d8-2640.png?version=8.0.0">
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://paper.dropboxstatic.com/static/img/ace/emoji/1f9d8-2640.png?version=8.0.0"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
