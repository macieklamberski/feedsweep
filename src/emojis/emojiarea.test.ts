import { expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('emojiareaEmojiResolver', (parseHtml) => {
  const { transform } = emojiConverters(parseHtml)

  it('should replace a painted span by the short name in its title', async () => {
    const value =
      '<p>Hi <span class="emoji  emoji-spritesheet-1" style="background-position: -324px -54px;" title="sunny">:sunny:</span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi ☀️</p>')
  })

  it('should replace an empty painted span', async () => {
    const value = '<p>Hi <span class="emoji emoji-spritesheet-0" title="point_down"></span></p>'

    expect(await transform(value)).toEqualHtml('<p>Hi 👇</p>')
  })

  it('should leave a painted span holding prose untouched', async () => {
    const value = '<p><span class="emoji emoji-spritesheet-1" title="sunny">A sunny day</span></p>'

    expect(await transform(value)).toEqualHtml(value)
  })
})
