import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('liferayEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  // Liferay draws each of these as its own face, so they keep their pictures.
  const markedNameCases: Array<string> = [
    'happy',
    'smile',
    'big_grin',
    'oh_my',
    'bashful',
    'smug',
    'roll_eyes',
    'suspicious',
    'in_love',
    'bored',
    'closed_eyes',
    'cold',
    'glare',
    'ninja',
  ]

  it.each(markedNameCases)('should mark the %s emoticon', async (name) => {
    const value = html`
      <p>
        <img
          alt="emoticon"
          src="https://example.com/o/classic-theme/images/emoticons/${name}.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="emoticon"
          src="https://example.com/o/classic-theme/images/emoticons/${name}.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark an emoticon under a Liferay 6 theme directory', async () => {
    const value = html`
      <p>
        <img
          alt="emoticon"
          src="https://example.com/html/themes/classic/images/emoticons/smile.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          data-emoji=""
          alt="emoticon"
          src="https://example.com/html/themes/classic/images/emoticons/smile.gif"
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a smile.gif without the emoticon alt through the forum names', async () => {
    const value = html`
      <p>
        <img
          class="smilies"
          src="https://example.com/images/emoticons/smile.gif"
          alt=""
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          class="smilies"
          src="https://example.com/images/emoticons/smile.gif"
          alt=""
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should mark a name the forum tables carry through the smilies resolver', async () => {
    const value = html`
      <p>
        <img
          alt="emoticon"
          src="https://example.com/o/classic-theme/images/emoticons/wink.gif"
        >
      </p>
    `
    const expected = html`
      <p>
        <img
          alt="emoticon"
          src="https://example.com/o/classic-theme/images/emoticons/wink.gif"
          data-emoji=""
        >
      </p>
    `

    expect(await transform(value)).toEqualHtml(expected)
  })

  it('should leave an emoticon-labelled image outside an emoticons directory untouched', async () => {
    const value = '<p><img alt="emoticon" src="https://example.com/images/smile.gif"></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
