import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('moodleEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should mark an emoticon with the emoticon class', async () => {
    const value = html`
      <p>
        <img
          class="icon emoticon"
          alt="smile"
          src="https://moodle.example.com/theme/image.php/boost/core/1783412454/s/smiley"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          class="icon emoticon"
          alt="smile"
          src="https://moodle.example.com/theme/image.php/boost/core/1783412454/s/smiley"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon without a class behind a doubled slash', async () => {
    const value = html`
      <p>
        <img
          alt="smile"
          src="https://moodle.example.com/theme/image.php/ou/core/1378190311//s/smiley"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          alt="smile"
          src="https://moodle.example.com/theme/image.php/ou/core/1378190311//s/smiley"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should convert an emoticon whose alt is an emoji', async () => {
    const value = html`
      <p>
        <img
          alt="😉"
          src="https://moodle.example.com/theme/image.php/boost/core/1783412454/s/wink"
        >
      </p>
    `
    const expected = '<p>😉</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an icon outside the emoticon folder untouched', async () => {
    const value = html`
      <p>
        <img
          alt="edit"
          src="https://moodle.example.com/theme/image.php/boost/core/1783412454/i/edit"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(value)
  })
})
