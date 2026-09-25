import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters } from '../tests.js'

describeForEachParser('genericEmojiResolver', (parseHtml) => {
  const { transformKeeping } = emojiConverters(parseHtml)

  describe('Discourse (emoji class with shortcode alt)', () => {
    it('should leave Discourse shortcode-alt with class="emoji" untouched', async () => {
      const value = '<p><img class="emoji" alt=":slight_smile:"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })

    it('should leave a gemoji shortcode-alt with class="emoji" untouched', async () => {
      const value = '<p><img class="emoji" alt=":tophat:"></p>'

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
