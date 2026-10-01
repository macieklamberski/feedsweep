import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('quillEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace an empty blot by its short name', async () => {
    const value = '<p>Hi <span class="ql-emojiblot" data-name="blush"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi 😊</p>')
  })

  it('should keep a name gemoji does not know as text', async () => {
    const value = '<p>Hi <span class="ql-emojiblot" data-name="spiral_calendar_pad"></span></p>'

    expect(await transform(value)).toEqualHtml(
      '<p>Hi <span data-emoji="">:spiral_calendar_pad:</span></p>',
    )
  })
})
