import { describe, expect, it } from 'bun:test'
import { describeForEachParser, emojiConverters, html } from '../tests.js'

describeForEachParser('weiboEmojiResolver', (parseHtml) => {
  const { transformKeeping } = emojiConverters(parseHtml)

  describe('Weibo (sinaimg emoticon path)', () => {
    it('should leave an emoticon with a bracketed localized alt untouched', async () => {
      const value = html`
        <p>
          <span class="url-icon">
            <img alt="[围观]" src="https://h5.sinaimg.cn/m/emoticon/icon/others/o_weiguan.png">
          </span>
        </p>
      `

      expect(await transformKeeping(value)).toEqualHtml(value)
    })
  })
})
