import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('discourseEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a stock emoji by its name', async () => {
    const value = html`
      <p>Nice
        <img
          src="https://forum.example.com/images/emoji/twitter/nerd_face.png?v=10"
          title=":nerd_face:"
          class="emoji"
          alt=":nerd_face:"
        >
      </p>
    `
    const expected = '<p>Nice 🤓</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a name the shared shortcode table draws as another face', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/apple/smile.png?v=12"
          title=":smile:"
          class="emoji"
          alt=":smile:"
        >
      </p>
    `
    const expected = '<p>😄</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a stock emoji served from the Discourse CDN', async () => {
    const value = html`
      <p>
        <img
          src="https://sjc3.discourse-cdn.com/business6/images/emoji/twitter/grinning.png?v=9"
          title=":grinning:"
          class="emoji"
          alt=":grinning:"
        >
      </p>
    `
    const expected = '<p>😀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should replace a stock emoji served from a relative path', async () => {
    const value = html`
      <p>
        <img
          src="/images/emoji/google/rocket.png?v=12"
          class="emoji"
          alt=":rocket:"
        >
      </p>
    `
    const expected = '<p>🚀</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should add the skin tone a toned file is named by', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/twitter/raised_hands/3.png?v=12"
          title=":raised_hands:t3:"
          class="emoji"
          alt=":raised_hands:t3:"
        >
      </p>
    `
    const expected = '<p>🙌🏼</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should put the skin tone inside a joined sequence', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/google/woman_shrugging/3.png?v=15"
          title=":woman_shrugging:t3:"
          class="emoji"
          alt=":woman_shrugging:t3:"
        >
      </p>
    `
    const expected = '<p>🤷🏼‍♀️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should put the skin tone in place of a variation selector', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/twitter/point_up/2.png?v=12"
          class="emoji"
          alt=":point_up:t2:"
        >
      </p>
    `
    const expected = '<p>☝🏻</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  const discourseNameCases: Array<[string, string]> = [
    ['relaxed', '😌'],
    ['frowning', '☹️'],
    ['bow', '🙇‍♂️'],
    ['policeman', '👮'],
    ['guardsman', '💂'],
    ['bride_with_veil', '👰'],
    ['massage', '💆‍♀️'],
    ['runner', '🏃‍♂️'],
    ['dancing_women', '👯'],
    ['rowboat', '🚣‍♂️'],
    ['swimmer', '🏊‍♂️'],
    ['bicyclist', '🚴‍♂️'],
    ['mountain_bicyclist', '🚵‍♂️'],
    ['kiss', '💏'],
    ['couplekiss', '👩‍❤️‍💋‍👨'],
    ['couple_with_heart', '👩‍❤️‍👨'],
    ['feet', '👣'],
    ['dog', '🐕'],
    ['cat', '🐈'],
    ['tiger', '🐅'],
    ['horse', '🐎'],
    ['cow', '🐄'],
    ['pig', '🐖'],
    ['camel', '🐪'],
    ['mouse', '🐁'],
    ['rabbit', '🐇'],
    ['whale', '🐋'],
    ['whale2', '🐳'],
    ['parasol_on_ground', '🏖️'],
    ['post_office', '🏤'],
    ['train', '🚆'],
    ['boat', '🛥️'],
    ['satellite', '🛰️'],
    ['moon', '🌑'],
    ['umbrella', '☂️'],
    ['snowman', '☃️'],
    ['sunglasses', '🕶️'],
    ['pencil', '✏️'],
    ['calendar', '📅'],
    ['sa', '🈶'],
    ['japan', '🇯🇵'],
  ]

  it.each(discourseNameCases)('should replace %s as Discourse draws it', async (name, glyph) => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/twitter/${name}.png?v=12"
          class="emoji"
          alt=":${name}:"
        >
      </p>
    `
    const expected = `<p>${glyph}</p>`

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should add the skin tone to a name Discourse draws as another glyph', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/twitter/runner/4.png?v=12"
          class="emoji"
          alt=":runner:t4:"
        >
      </p>
    `
    const expected = '<p>🏃🏽‍♂️</p>'

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an unknown name', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/images/emoji/twitter/slight_smile.png?v=12"
          class="emoji"
          alt=":slight_smile:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://forum.example.com/images/emoji/twitter/slight_smile.png?v=12"
          class="emoji"
          alt=":slight_smile:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a custom emoji upload to the generic marker', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/uploads/default/original/3X/4/6/46274676d65997b1b701cee87050d33780e8cd4b.png?v=14"
          title=":slight_smile:"
          class="emoji emoji-custom"
          alt=":slight_smile:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://forum.example.com/uploads/default/original/3X/4/6/46274676d65997b1b701cee87050d33780e8cd4b.png?v=14"
          title=":slight_smile:"
          class="emoji emoji-custom"
          alt=":slight_smile:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave a custom emoji named like a stock one to the generic marker', async () => {
    const value = html`
      <p>
        <img
          src="https://forum.example.com/uploads/default/original/1X/rocket.png?v=14"
          class="emoji emoji-custom"
          alt=":rocket:"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          src="https://forum.example.com/uploads/default/original/1X/rocket.png?v=14"
          class="emoji emoji-custom"
          alt=":rocket:"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })
})
